#!/usr/bin/env bash
# Evaluate a JS expression inside the active Obsidian renderer over the
# Chrome DevTools Protocol and print the result.
#
# Usage:
#   PORT=9223 ./scripts/e2e/cdp.sh '<js expression>'
#   ./scripts/e2e/cdp.sh "$(cat scripts/e2e/cdp-e2e-all.js)"
#
# Prerequisites:
#   - Obsidian launched with --remote-debugging-port=$PORT
#       open -a Obsidian --args --remote-debugging-port=9223
#   - websocat on PATH       (brew install websocat)
#   - python3 on PATH        (preinstalled on macOS)
#
# Notes:
#   - The expression runs in the Obsidian renderer; `app`, `app.plugins`,
#     `app.vault`, `activeDocument`, `navigator.clipboard`, etc. are in scope.
#   - awaitPromise:true is set, so wrap multi-statement scripts in an
#     async IIFE that returns a JSON-serializable value.
#   - Do NOT use `require("obsidian")` or dynamically import the bundle from
#     inside the expression — `obsidian` is an esbuild external and resolves
#     to nothing at runtime in this context.

set -e
PORT="${PORT:-9223}"

WS=$(curl -s "http://localhost:$PORT/json/list" | python3 -c "
import json, sys
pages = [t['webSocketDebuggerUrl'] for t in json.load(sys.stdin) if t['type'] == 'page']
if not pages:
    sys.exit('no page target found on port $PORT — is Obsidian running with --remote-debugging-port?')
print(pages[0])
")

EXPR="$1"
if [ -z "$EXPR" ]; then
    echo "usage: $0 '<js expression>'" >&2
    exit 1
fi

PAYLOAD=$(python3 -c "
import json, sys
print(json.dumps({
    'id': 1,
    'method': 'Runtime.evaluate',
    'params': {
        'expression': sys.argv[1],
        'returnByValue': True,
        'awaitPromise': True,
    }
}))
" "$EXPR")

echo "$PAYLOAD" | websocat -n1 "$WS" | python3 -c "
import json, sys
r = json.load(sys.stdin)
if 'result' in r and 'result' in r['result']:
    v = r['result']['result']
    if v.get('type') == 'string':
        print(v.get('value', ''))
    elif 'value' in v:
        print(json.dumps(v['value'], indent=2, ensure_ascii=False))
    else:
        print(json.dumps(v, indent=2, ensure_ascii=False))
    if r['result'].get('exceptionDetails'):
        print('EXCEPTION:', json.dumps(r['result']['exceptionDetails'], indent=2), file=sys.stderr)
        sys.exit(2)
else:
    print(json.dumps(r, indent=2), file=sys.stderr)
    sys.exit(1)
"
