// Mermaid round-trip test.
//
// What it does:
//   - Creates a temp note containing a mermaid code fence.
//   - Configures Aliyun OSS as the backing store (adjust if needed).
//   - Runs the `image-upload-toolkit:publish-page` command.
//   - Asserts the clipboard output contains an uploaded PNG URL and that
//     the original mermaid fence has been replaced.
//   - Cleans up the temp note.
//
// Usage:
//   ./scripts/e2e/cdp.sh "$(cat scripts/e2e/cdp-mermaid-e2e.js)"
//
// Pre-reqs:
//   - Adjust `STORE_ID` below if you want to upload via a different store.
//   - The store must have valid credentials configured in the vault.

(async () => {
  const STORE_ID = "ALIYUN_OSS";  // adjust to whichever store you have creds for

  const plugin = app.plugins.plugins["image-upload-toolkit"];
  if (!plugin) throw new Error("image-upload-toolkit plugin not loaded");

  const origSettings = JSON.parse(JSON.stringify(plugin.settings));
  plugin.settings.imageStore = STORE_ID;
  plugin.settings.convertMermaid = true;
  plugin.settings.showProgressModal = false;
  plugin.setupImageUploader();

  const fname = `__iut-e2e-mermaid-${Date.now()}.md`;
  const content = "# E2E mermaid test\n\n```mermaid\nflowchart LR\n  A-->B\n  B-->C\n```\n\nend\n";
  const file = await app.vault.create(fname, content);

  try {
    const leaf = app.workspace.getLeaf(false);
    await leaf.openFile(file);
    await new Promise(r => setTimeout(r, 500));

    await navigator.clipboard.writeText("");
    const ok = app.commands.executeCommandById("image-upload-toolkit:publish-page");
    if (!ok) throw new Error("publish-page command failed to execute");

    // Wait for upload to finish (poll clipboard)
    let clip = "";
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 500));
      clip = await navigator.clipboard.readText();
      if (clip && clip.length > 100) break;
    }

    const pngs = (clip.match(/https?:\/\/[^\s)]+\.png/g) || []);
    const hasMermaidBlock = /```mermaid/.test(clip);
    return JSON.stringify({
      ok: pngs.length > 0 && !hasMermaidBlock,
      png_urls: pngs,
      mermaid_block_still_present: hasMermaidBlock,
      clip_length: clip.length,
      snippet: clip.slice(0, 400)
    }, null, 2);
  } finally {
    try { await app.vault.delete(file); } catch {}
    Object.assign(plugin.settings, origSettings);
    plugin.setupImageUploader();
  }
})()
