// Multi-store upload smoke test for image-upload-toolkit.
//
// What it does:
//   - Iterates a list of ImageStore IDs configured in the running vault.
//   - For each store, mutates plugin.settings.imageStore, rebuilds the
//     uploader, and uploads a 1x1 PNG sentinel directly via uploader.upload().
//   - Reports per-store {ok, url|err} JSON.
//   - Restores the original imageStore before returning.
//
// Usage:
//   ./scripts/e2e/cdp.sh "$(cat scripts/e2e/cdp-e2e-all.js)"
//
// Pre-reqs:
//   - The vault running in the CDP-attached Obsidian must have valid
//     credentials configured for every store listed in `stores` below.
//     Stores you don't have creds for will fail in the "upload" phase
//     and won't pollute anything else.
//   - Sentinel filenames are prefixed `iut-e2e-` so they are easy to
//     identify and prune from your bucket after the run.

(async () => {
  const plugin = app.plugins.plugins["image-upload-toolkit"];
  if (!plugin) throw new Error("image-upload-toolkit plugin not loaded");

  const originalStore = plugin.settings.imageStore;

  // 1x1 transparent PNG
  const b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);

  // Adjust this list to match the stores you have creds for. Canonical
  // IDs come from src/imageStore.ts (note casing!).
  const stores = ["ALIYUN_OSS", "AWS_S3", "Imagekit", "IMGUR", "TENCENTCLOUD_COS"];
  const results = [];

  for (const store of stores) {
    plugin.settings.imageStore = store;
    try {
      plugin.setupImageUploader();
    } catch (e) {
      results.push({ store, ok: false, phase: "setup", err: String(e?.message || e) });
      continue;
    }
    const up = plugin.imageUploader;
    if (!up) {
      results.push({ store, ok: false, err: "no uploader after setup" });
      continue;
    }
    const fname = `iut-e2e-${store.toLowerCase()}-${Date.now()}.png`;
    try {
      const file = new File([bytes], fname, { type: "image/png" });
      const url = await up.upload(file, fname);
      results.push({ store, ok: true, url });
    } catch (e) {
      results.push({ store, ok: false, phase: "upload", err: String(e?.message || e).slice(0, 200) });
    }
  }

  plugin.settings.imageStore = originalStore;
  plugin.setupImageUploader();
  return JSON.stringify(results, null, 2);
})()
