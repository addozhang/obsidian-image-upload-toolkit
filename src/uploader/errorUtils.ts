/**
 * Extract a human-readable message from an `unknown` thrown value.
 *
 * Handles Error instances, plain objects with `message`/`error` fields
 * (e.g. ApiError shapes from SDKs and Obsidian's requestUrl), and
 * primitive throws. Returns "Unknown error" as a last resort so callers
 * never have to deal with `unknown` themselves.
 */
export function errorMessage(e: unknown): string {
    if (e instanceof Error) return e.message;
    if (typeof e === "string") return e;
    if (e && typeof e === "object") {
        const obj = e as { message?: unknown; error?: unknown };
        if (typeof obj.message === "string") return obj.message;
        if (typeof obj.error === "string") return obj.error;
    }
    return "Unknown error";
}
