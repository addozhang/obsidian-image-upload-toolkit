# CDP-based End-to-End Tests

These scripts drive a real Obsidian instance over the [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/) to validate the publish flow against live cloud credentials. Use them when:

- You changed an uploader and want to confirm it still talks to the real bucket.
- You're prepping a release and want to verify the user-visible publish flow end to end (UI modal, clipboard output, editor rewrite, mermaid conversion, etc).
- You suspect an Electron-specific runtime issue that unit tests can't catch (e.g. `requestUrl` header validation).

These are intentionally **not** wired into CI — they hit real buckets and require manual credentials.

## Prerequisites

- A test vault with the plugin installed and live credentials configured for whatever stores you want to exercise.
- Obsidian launched with the CDP endpoint enabled:
  ```bash
  open -a Obsidian --args --remote-debugging-port=9223
  ```
- `websocat` and `python3` on `PATH`:
  ```bash
  brew install websocat
  ```

## The helper

[`cdp.sh`](cdp.sh) wraps a single `Runtime.evaluate` call to the active page. Pass any JavaScript expression as the first argument; the expression runs in the Obsidian renderer with full access to `app`, `app.plugins`, `app.vault`, `navigator.clipboard`, `activeDocument`, etc.

```bash
# Inline expression
./scripts/e2e/cdp.sh 'app.plugins.plugins["image-upload-toolkit"].manifest.version'

# Load a script file
./scripts/e2e/cdp.sh "$(cat scripts/e2e/cdp-e2e-all.js)"

# Custom port
PORT=9333 ./scripts/e2e/cdp.sh '...'
```

Multi-statement scripts must be wrapped in an async IIFE that returns a JSON-serializable value, because `awaitPromise: true` is passed and the result is fetched via `returnByValue: true`.

## Scripts

| File | Purpose |
|------|---------|
| [`cdp.sh`](cdp.sh) | Generic `Runtime.evaluate` helper |
| [`cdp-e2e-all.js`](cdp-e2e-all.js) | Multi-store upload smoke test (iterates stores, uploads a 1x1 PNG sentinel via each) |
| [`cdp-mermaid-e2e.js`](cdp-mermaid-e2e.js) | Mermaid round-trip: creates a fence, runs publish, asserts upload + fence removal |
| [`cdp-e2e-supplemental.js`](cdp-e2e-supplemental.js) | 13-case suite covering settings panel, progress modal, web image download/skip, multi-mermaid, theme/scale, `replaceOriginalDoc`, wiki-link, hosted-URL dedupe, `ignoreProperties`, `imageAltText` |

Each script has a header comment block documenting its assumptions and any constants you may need to edit (e.g. `STORE_ID`, `BUCKET_HOST_RE`).

## Plugin reload via CDP

After copying a new build into the vault, hot-reload the plugin:

```bash
./scripts/e2e/cdp.sh '(async () => {
  await app.plugins.disablePlugin("image-upload-toolkit");
  await app.plugins.enablePlugin("image-upload-toolkit");
  return app.plugins.plugins["image-upload-toolkit"].manifest.version;
})()'
```

## Footguns

- **`require("obsidian")` and dynamic `import()` of the bundle don't work** inside the CDP expression — `obsidian` is an esbuild external and resolves to nothing at runtime in this context. Use the plugin instance (`app.plugins.plugins["image-upload-toolkit"]`) for everything you need from the API.
- **`editor.setValue()` does NOT persist to disk.** When asserting on `replaceOriginalDoc` behavior, read `leaf.view.editor.getValue()`, not `app.vault.read(file)`.
- **Commands are `checkCallback`-based.** Use `app.commands.executeCommandById("image-upload-toolkit:publish-page")`. Don't call `.callback` directly.
- **Progress modal is async.** Don't query it once — poll `activeDocument.querySelector(".modal.upload-progress-modal")` for a few hundred ms after triggering publish.
- **macOS TCC blocks `~/Documents`** for non-Obsidian processes. Place test vaults under `~/iCloud Drive/` or another accessible location.

## Cleanup expectations

The scripts upload to real buckets. They:

- Prefix all sentinel filenames with `iut-` or `__iut-` so they're easy to identify and prune.
- Snapshot `plugin.settings` before mutating and restore it after the run.
- Delete temp notes/images created in the vault via `app.vault.delete(file)`.

Residual sentinel files in your bucket are harmless but accumulate over time — periodically prune them with whatever bucket-management tool you use.

## Canonical IDs and setting keys

When mutating settings programmatically, use the exact casing from [`src/imageStore.ts`](../../src/imageStore.ts):

| Store         | `ImageStore.id`    | Settings key            |
|---------------|--------------------|-------------------------|
| Imgur         | `IMGUR`            | `imgurAnonymousSetting` |
| Aliyun OSS    | `ALIYUN_OSS`       | `ossSetting`            |
| ImageKit      | `Imagekit`         | `imagekitSetting`       |
| AWS S3        | `AWS_S3`           | `awsS3Setting`          |
| Tencent COS   | `TENCENTCLOUD_COS` | `cosSetting`            |
| Qiniu Kodo    | `QINIU_KUDO`       | `kodoSetting`           |
| GitHub        | `GITHUB`           | `githubSetting`         |
| Gyazo         | `GYAZO`            | `gyazoSetting`          |
| Cloudflare R2 | `CLOUDFLARE_R2`    | `r2Setting`             |
| Backblaze B2  | `BACKBLAZE_B2`     | `b2Setting`             |
