// Comprehensive supplementary E2E suite for image-upload-toolkit.
//
// Covers 13 cases:
//   1.  Settings panel renders without throwing (and headings aren't ALL CAPS)
//   2.  Progress modal appears when showProgressModal=true and images>0
//   3.  Web image downloaded + uploaded when uploadWebImages=true
//   4.  Web image skipped when uploadWebImages=false
//   5.  Multi mermaid block + dark theme + scale=3
//   6.  Mermaid theme=forest renders & uploads
//   7.  replaceOriginalDoc=true rewrites the editor buffer
//   8.  Wiki-link image syntax ![[name.png]] is uploaded & rewritten
//   9.  Already-hosted image NOT re-uploaded (short-circuit)
//   10. ignoreProperties=true strips YAML frontmatter from clipboard output
//   11. ignoreProperties=false keeps YAML frontmatter
//   12. imageAltText=true populates alt text from filename
//   13. imageAltText=false produces empty alt text
//
// Usage:
//   ./scripts/e2e/cdp.sh "$(cat scripts/e2e/cdp-e2e-supplemental.js)"
//
// Configuration:
//   - Edit STORE_ID and BUCKET_HOST_RE below to match the store you have
//     creds for in the running vault. BUCKET_HOST_RE is used to assert
//     that uploaded URLs land on the expected host.
//
// Notes:
//   - All cases run in a fresh setup() that snapshots & restores
//     plugin.settings.
//   - Temp notes/images are tracked in tmpFiles and deleted at the end.
//   - The run uploads to your real bucket — sentinel filenames are
//     prefixed `__iut-` so they're easy to identify and prune.

(async () => {
  const STORE_ID       = "ALIYUN_OSS";  // canonical ID from src/imageStore.ts
  const BUCKET_HOST_RE = /oss-cn-hangzhou\.aliyuncs\.com/;  // regex matching uploaded URL host

  const plugin = app.plugins.plugins["image-upload-toolkit"];
  if (!plugin) throw new Error("image-upload-toolkit plugin not loaded");

  const origSettings = JSON.parse(JSON.stringify(plugin.settings));
  const results = [];
  const log = (name, ok, detail) => results.push({ name, ok, detail });
  const tmpFiles = [];

  const setup = (overrides = {}) => {
    Object.assign(plugin.settings, {
      imageStore: STORE_ID,
      convertMermaid: false,
      showProgressModal: false,
      uploadWebImages: false,
      replaceOriginalDoc: false,
      ignoreProperties: true,
      imageAltText: true,
    }, overrides);
    plugin.setupImageUploader();
  };

  const createNote = async (name, content) => {
    const f = await app.vault.create(name, content);
    tmpFiles.push(f);
    const leaf = app.workspace.getLeaf(false);
    await leaf.openFile(f);
    await new Promise(r => setTimeout(r, 400));
    return f;
  };

  const runPublishAndGetClip = async (timeoutMs = 30000) => {
    await navigator.clipboard.writeText("");
    app.commands.executeCommandById("image-upload-toolkit:publish-page");
    const start = Date.now();
    let clip = "";
    while (Date.now() - start < timeoutMs) {
      await new Promise(r => setTimeout(r, 400));
      clip = await navigator.clipboard.readText();
      if (clip && clip.length > 10) break;
    }
    return clip;
  };

  // ─────────────────────────────────────────────────────────────
  // 1. Settings panel renders without throwing
  // ─────────────────────────────────────────────────────────────
  try {
    const tab = app.setting;
    tab.open();
    tab.openTabById("image-upload-toolkit");
    await new Promise(r => setTimeout(r, 600));
    const container = tab.activeTab?.containerEl;
    const settingItems = container?.querySelectorAll(".setting-item")?.length || 0;
    const headings = [...(container?.querySelectorAll(".setting-item-heading") || [])]
      .map(el => el.textContent?.trim()).filter(Boolean);
    const hasShout = headings.some(h => h.length > 3 && h === h.toUpperCase());
    tab.close();
    log("settings_panel_renders", settingItems > 5 && !hasShout, { settingItems, headingCount: headings.length, sampleHeadings: headings.slice(0, 6) });
  } catch (e) {
    log("settings_panel_renders", false, { err: String(e?.message || e) });
  }

  // ─────────────────────────────────────────────────────────────
  // 2. Progress modal appears
  // ─────────────────────────────────────────────────────────────
  try {
    setup({ showProgressModal: true, uploadWebImages: true });
    await createNote(`__iut-modal-${Date.now()}.md`,
      "# modal test\n\n![web](https://placehold.co/3x3.png)\n");
    await navigator.clipboard.writeText("");
    app.commands.executeCommandById("image-upload-toolkit:publish-page");
    let modalSeen = false;
    let modalTitle = null;
    let modalClasses = null;
    for (let i = 0; i < 40; i++) {
      await new Promise(r => setTimeout(r, 200));
      const modal = activeDocument.querySelector(".modal.upload-progress-modal");
      if (modal) {
        modalSeen = true;
        modalClasses = modal.className;
        const titleEl = activeDocument.querySelector(".modal.upload-progress-modal .modal-title")
          || activeDocument.querySelector(".modal-container .modal-title");
        modalTitle = titleEl?.textContent?.trim() || null;
        break;
      }
    }
    await new Promise(r => setTimeout(r, 6000));
    log("progress_modal_appears", modalSeen, { modalTitle, modalClasses });
  } catch (e) {
    log("progress_modal_appears", false, { err: String(e?.message || e) });
  }

  // ─────────────────────────────────────────────────────────────
  // 3. Web image download + upload
  // ─────────────────────────────────────────────────────────────
  try {
    setup({ uploadWebImages: true });
    await createNote(`__iut-webimg-${Date.now()}.md`,
      "# web image test\n\n![remote](https://placehold.co/4x4.png)\n");
    const clip = await runPublishAndGetClip();
    const hasHostedUrl = BUCKET_HOST_RE.test(clip);
    const noPlaceholdLink = !/placehold\.co/.test(clip);
    log("web_image_download_upload", hasHostedUrl && noPlaceholdLink, { snippet: clip.slice(0, 250) });
  } catch (e) {
    log("web_image_download_upload", false, { err: String(e?.message || e) });
  }

  // ─────────────────────────────────────────────────────────────
  // 4. Web image SKIPPED when uploadWebImages=false
  // ─────────────────────────────────────────────────────────────
  try {
    setup({ uploadWebImages: false });
    await createNote(`__iut-webimg-skip-${Date.now()}.md`,
      "# skip test\n\n![remote](https://placehold.co/4x4.png)\n");
    const clip = await runPublishAndGetClip(8000);
    const stillHasOriginal = /placehold\.co/.test(clip);
    const noUploadedUrl = !BUCKET_HOST_RE.test(clip);
    log("web_image_skipped_when_disabled", stillHasOriginal && noUploadedUrl, { snippet: clip.slice(0, 200) });
  } catch (e) {
    log("web_image_skipped_when_disabled", false, { err: String(e?.message || e) });
  }

  // ─────────────────────────────────────────────────────────────
  // 5. Multi mermaid blocks + dark theme + scale=3
  // ─────────────────────────────────────────────────────────────
  try {
    setup({ convertMermaid: true });
    plugin.settings.mermaidTheme = "dark";
    plugin.settings.mermaidScale = 3;
    plugin.setupImageUploader();
    await createNote(`__iut-mer-multi-${Date.now()}.md`,
      "# multi mermaid\n\n```mermaid\nflowchart LR\nA-->B\n```\n\n```mermaid\nsequenceDiagram\nAlice->>Bob: hi\nBob-->>Alice: hello\n```\n\nend\n");
    const clip = await runPublishAndGetClip(45000);
    const pngs = clip.match(/https?:\/\/[^\s)]+mermaid-export-[^\s)]+\.png/g) || [];
    const noFence = !/```mermaid/.test(clip);
    log("mermaid_multi_block_dark_scale3", pngs.length === 2 && noFence, { pngCount: pngs.length, sample: pngs[0] });
  } catch (e) {
    log("mermaid_multi_block_dark_scale3", false, { err: String(e?.message || e) });
  }

  // ─────────────────────────────────────────────────────────────
  // 6. Mermaid theme=forest
  // ─────────────────────────────────────────────────────────────
  try {
    setup({ convertMermaid: true });
    plugin.settings.mermaidTheme = "forest";
    plugin.settings.mermaidScale = 2;
    plugin.setupImageUploader();
    await createNote(`__iut-mer-forest-${Date.now()}.md`,
      "# forest\n\n```mermaid\nflowchart TD\nX-->Y\n```\n");
    const clip = await runPublishAndGetClip(20000);
    const ok = /mermaid-export-[^\s)]+\.png/.test(clip) && !/```mermaid/.test(clip);
    log("mermaid_theme_forest", ok, { snippet: clip.slice(0, 250) });
  } catch (e) {
    log("mermaid_theme_forest", false, { err: String(e?.message || e) });
  }

  // ─────────────────────────────────────────────────────────────
  // 7. replaceOriginalDoc=true rewrites the editor buffer
  // ─────────────────────────────────────────────────────────────
  try {
    setup({ uploadWebImages: true, replaceOriginalDoc: true });
    await createNote(`__iut-replace-${Date.now()}.md`,
      "# replace test\n\n![pic](https://placehold.co/5x5.png)\n");
    await runPublishAndGetClip(20000);
    await new Promise(r => setTimeout(r, 1500));
    // Read from the active editor (setValue does not auto-save to disk)
    const leaf = app.workspace.activeLeaf;
    let editorText = null;
    if (leaf?.view?.editor?.getValue) {
      editorText = leaf.view.editor.getValue();
    } else if (leaf?.view?.getViewData) {
      editorText = leaf.view.getViewData();
    }
    const editorRewritten = editorText && !/placehold\.co/.test(editorText) && BUCKET_HOST_RE.test(editorText);
    log("replace_original_doc", !!editorRewritten, { editor: (editorText || "").slice(0, 250) });
  } catch (e) {
    log("replace_original_doc", false, { err: String(e?.message || e) });
  }

  // ─────────────────────────────────────────────────────────────
  // 8. Wiki-link image upload ![[name.png]]
  // ─────────────────────────────────────────────────────────────
  try {
    setup();
    const b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";
    const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    const imgName = `__iut-wiki-img-${Date.now()}.png`;
    const imgFile = await app.vault.createBinary(imgName, bytes.buffer);
    tmpFiles.push(imgFile);
    await createNote(`__iut-wiki-${Date.now()}.md`,
      `# wiki link\n\n![[${imgName}]]\n`);
    const clip = await runPublishAndGetClip(15000);
    const replaced = !/\[\[/.test(clip) && BUCKET_HOST_RE.test(clip);
    log("wiki_link_image_upload", replaced, { snippet: clip.slice(0, 250) });
  } catch (e) {
    log("wiki_link_image_upload", false, { err: String(e?.message || e) });
  }

  // ─────────────────────────────────────────────────────────────
  // 9. Already-hosted image is NOT re-uploaded
  // ─────────────────────────────────────────────────────────────
  try {
    setup({ uploadWebImages: true });
    // Construct a "hosted" URL that matches BUCKET_HOST_RE
    const hostedHost = (BUCKET_HOST_RE.source || "").replace(/\\./g, ".").replace(/[^A-Za-z0-9.\-]/g, "");
    const hosted = `https://${hostedHost || "example.com"}/static/already-hosted.png`;
    await createNote(`__iut-hosted-${Date.now()}.md`,
      `# hosted\n\n![hosted](${hosted})\n`);
    const clip = await runPublishAndGetClip(8000);
    const occurrences = (clip.match(new RegExp(hosted.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || []).length;
    const noNewTimestampedUpload = !new RegExp(`${BUCKET_HOST_RE.source}[^\\s]*\\/\\d{4}\\/\\d{2}\\/\\d{2}\\/already-hosted`).test(clip);
    log("hosted_image_not_reuploaded", occurrences === 1 && noNewTimestampedUpload, { occurrences, snippet: clip.slice(0, 250) });
  } catch (e) {
    log("hosted_image_not_reuploaded", false, { err: String(e?.message || e) });
  }

  // ─────────────────────────────────────────────────────────────
  // 10. ignoreProperties=true strips frontmatter
  // ─────────────────────────────────────────────────────────────
  try {
    setup({ ignoreProperties: true });
    await createNote(`__iut-fm-strip-${Date.now()}.md`,
      "---\ntitle: x\ntags: [a,b]\n---\n\n# body only\n\nhello\n");
    const clip = await runPublishAndGetClip(5000);
    const stripped = !/^---/m.test(clip) && /# body only/.test(clip);
    log("ignore_properties_strips_frontmatter", stripped, { snippet: clip.slice(0, 200) });
  } catch (e) {
    log("ignore_properties_strips_frontmatter", false, { err: String(e?.message || e) });
  }

  // ─────────────────────────────────────────────────────────────
  // 11. ignoreProperties=false keeps frontmatter
  // ─────────────────────────────────────────────────────────────
  try {
    setup({ ignoreProperties: false });
    await createNote(`__iut-fm-keep-${Date.now()}.md`,
      "---\ntitle: y\n---\n\n# kept\n");
    const clip = await runPublishAndGetClip(5000);
    const kept = /^---/m.test(clip) && /title: y/.test(clip);
    log("ignore_properties_keeps_when_off", kept, { snippet: clip.slice(0, 200) });
  } catch (e) {
    log("ignore_properties_keeps_when_off", false, { err: String(e?.message || e) });
  }

  // ─────────────────────────────────────────────────────────────
  // 12. imageAltText=true populates alt text from filename
  // ─────────────────────────────────────────────────────────────
  try {
    setup({ imageAltText: true });
    const b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";
    const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    const imgName = `my-fancy_picture-${Date.now()}.png`;
    const imgFile = await app.vault.createBinary(imgName, bytes.buffer);
    tmpFiles.push(imgFile);
    await createNote(`__iut-alt-${Date.now()}.md`,
      `# alt\n\n![[${imgName}]]\n`);
    const clip = await runPublishAndGetClip(15000);
    const altMatch = clip.match(/!\[([^\]]+)\]\(https?:[^)]+\)/);
    const altLooksFromName = !!altMatch && /fancy picture/.test(altMatch[1]);
    log("image_alt_text_from_filename", altLooksFromName, { alt: altMatch?.[1], snippet: clip.slice(0, 250) });
  } catch (e) {
    log("image_alt_text_from_filename", false, { err: String(e?.message || e) });
  }

  // ─────────────────────────────────────────────────────────────
  // 13. imageAltText=false produces empty alt
  // ─────────────────────────────────────────────────────────────
  try {
    setup({ imageAltText: false });
    const b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";
    const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    const imgName = `no-alt-${Date.now()}.png`;
    const imgFile = await app.vault.createBinary(imgName, bytes.buffer);
    tmpFiles.push(imgFile);
    await createNote(`__iut-noalt-${Date.now()}.md`,
      `# noalt\n\n![[${imgName}]]\n`);
    const clip = await runPublishAndGetClip(15000);
    const altMatch = clip.match(/!\[([^\]]*)\]\(https?:[^)]+\)/);
    const isEmpty = altMatch && altMatch[1] === "";
    log("image_alt_text_empty_when_off", !!isEmpty, { alt: altMatch?.[1], snippet: clip.slice(0, 250) });
  } catch (e) {
    log("image_alt_text_empty_when_off", false, { err: String(e?.message || e) });
  }

  // ─────────────────────────────────────────────────────────────
  // Cleanup
  // ─────────────────────────────────────────────────────────────
  for (const f of tmpFiles) {
    try { await app.vault.delete(f); } catch {}
  }
  Object.assign(plugin.settings, origSettings);
  plugin.setupImageUploader();

  const passed = results.filter(r => r.ok).length;
  return JSON.stringify({
    summary: `${passed}/${results.length} passed`,
    results
  }, null, 2);
})()
