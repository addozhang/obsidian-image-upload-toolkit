import { beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "obsidian";
import ImageTagProcessor, { ACTION_PUBLISH } from "../../src/uploader/imageTagProcessor";
import type ImageUploader from "../../src/uploader/imageUploader";
import type { PublishSettings } from "../../src/publish";
import ImageStore from "../../src/imageStore";

const makeSettings = (overrides: any = {}) =>
  ({
    imageAltText: true,
    replaceOriginalDoc: false,
    ignoreProperties: false,
    imageStore: ImageStore.TENCENTCLOUD_COS.id,
    uploadWebImages: false,
    convertMermaid: false,
    ...overrides,
  }) as any as PublishSettings;

/**
 * Wires an ImageTagProcessor onto a stub vault.
 *
 * @param markdown       editor content to process
 * @param resolvedLinks  link text -> vault-relative path, as metadataCache would resolve it
 */
function setup(markdown: string, resolvedLinks: Record<string, string>) {
  const app = new App() as any;
  app.workspace.getActiveFile = () => ({ path: "notes/2026/09/note.md", name: "note.md" });
  app.workspace.getActiveViewOfType = () => ({
    editor: { getValue: () => markdown, setValue: vi.fn() },
  });
  app.metadataCache.getFirstLinkpathDest = (link: string) => {
    const resolved = resolvedLinks[link];
    return resolved ? { path: resolved, name: resolved.split("/").pop() } : null;
  };
  app.vault.getAbstractFileByPath = (p: string) => ({ path: p });

  const uploadedNames: string[] = [];
  const uploader: ImageUploader = {
    upload: async (image: File) => {
      uploadedNames.push(image.name);
      return `https://cdn.example.com/${image.name}`;
    },
  };

  return {
    processor: new ImageTagProcessor(app, makeSettings(), uploader, false),
    uploadedNames,
  };
}

describe("ImageTagProcessor object keys", () => {
  let writeText: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(globalThis.navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
  });

  it("strips the ../ segments Obsidian emits for relative links", async () => {
    const { processor, uploadedNames } = setup("![](../../../_tmp/pic.png)", {
      "../../../_tmp/pic.png": "_tmp/pic.png",
    });

    await processor.process(ACTION_PUBLISH);

    // A key carrying `../` is normalized away by the HTTP layer before the
    // request leaves Electron, which breaks pre-signed keys (e.g. COS returns
    // SignatureDoesNotMatch because it signs the collapsed path).
    expect(uploadedNames).toEqual(["pic.png"]);
    expect(writeText).toHaveBeenCalledWith("![pic](https://cdn.example.com/pic.png)");
  });

  it("keeps the directory part out of keys for plain relative links", async () => {
    const { processor, uploadedNames } = setup("![](attachments/pic.png)", {
      "attachments/pic.png": "notes/2026/09/attachments/pic.png",
    });

    await processor.process(ACTION_PUBLISH);

    expect(uploadedNames).toEqual(["pic.png"]);
  });

  it("uses the basename for wiki links", async () => {
    const { processor, uploadedNames } = setup("![[pic.png]]", { "pic.png": "_tmp/pic.png" });

    await processor.process(ACTION_PUBLISH);

    expect(uploadedNames).toEqual(["pic.png"]);
  });

  it("falls back to the basename when the link does not resolve", async () => {
    const { processor, uploadedNames } = setup("![](../_tmp/pic.png)", {});

    await processor.process(ACTION_PUBLISH);

    expect(uploadedNames).toEqual(["pic.png"]);
  });
});
