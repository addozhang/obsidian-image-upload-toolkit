import { describe, expect, it } from "vitest";
import MermaidProcessor, { VALID_THEMES } from "../../src/uploader/mermaidProcessor";
import type ImageUploader from "../../src/uploader/imageUploader";

const mockUploader: ImageUploader = {
  upload: async () => "https://example.com/test.png",
};

describe("MermaidProcessor constructor scale clamping", () => {
  it("clamps 0 to 1", () => {
    const processor = new MermaidProcessor(mockUploader, 0, "default");
    expect((processor as unknown as { scale: number }).scale).toBe(1);
  });

  it("clamps 5 to 4", () => {
    const processor = new MermaidProcessor(mockUploader, 5, "default");
    expect((processor as unknown as { scale: number }).scale).toBe(4);
  });

  it("rounds 2.7 to 3", () => {
    const processor = new MermaidProcessor(mockUploader, 2.7, "default");
    expect((processor as unknown as { scale: number }).scale).toBe(3);
  });

  it("clamps -1 to 1", () => {
    const processor = new MermaidProcessor(mockUploader, -1, "default");
    expect((processor as unknown as { scale: number }).scale).toBe(1);
  });

  it("keeps 3 as 3", () => {
    const processor = new MermaidProcessor(mockUploader, 3, "default");
    expect((processor as unknown as { scale: number }).scale).toBe(3);
  });
});

describe("MermaidProcessor constructor theme validation", () => {
  it("accepts dark", () => {
    const processor = new MermaidProcessor(mockUploader, 2, "dark");
    expect((processor as unknown as { theme: string }).theme).toBe("dark");
  });

  it("falls back invalid theme to default", () => {
    const processor = new MermaidProcessor(mockUploader, 2, "invalid");
    expect((processor as unknown as { theme: string }).theme).toBe("default");
  });

  it("falls back empty theme to default", () => {
    const processor = new MermaidProcessor(mockUploader, 2, "");
    expect((processor as unknown as { theme: string }).theme).toBe("default");
  });

  it("accepts forest", () => {
    const processor = new MermaidProcessor(mockUploader, 2, "forest");
    expect((processor as unknown as { theme: string }).theme).toBe("forest");
  });
});

describe("VALID_THEMES", () => {
  it("contains expected theme list", () => {
    expect(VALID_THEMES).toEqual(["default", "dark", "forest", "neutral", "base"]);
  });
});
