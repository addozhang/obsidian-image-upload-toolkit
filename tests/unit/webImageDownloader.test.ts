import { afterEach, describe, expect, it, vi } from "vitest";
import {
  extractFilename,
  getExtensionFromContentType,
  WebImageDownloader,
} from "../../src/uploader/webImageDownloader";

describe("WebImageDownloader.isWebImage", () => {
  it("returns true for http and https URLs", () => {
    expect(WebImageDownloader.isWebImage("http://example.com/img.png")).toBe(true);
    expect(WebImageDownloader.isWebImage("https://example.com/img.jpg")).toBe(true);
  });

  it("returns false for local ftp and empty paths", () => {
    expect(WebImageDownloader.isWebImage("./local.png")).toBe(false);
    expect(WebImageDownloader.isWebImage("path/to/image.jpg")).toBe(false);
    expect(WebImageDownloader.isWebImage("ftp://server/img.png")).toBe(false);
    expect(WebImageDownloader.isWebImage("")).toBe(false);
  });
});

describe("extractFilename", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns filename when URL already has image extension", () => {
    expect(extractFilename("https://example.com/path/photo.png")).toBe("photo.png");
  });

  it("decodes encoded filename", () => {
    expect(extractFilename("https://example.com/path/%E5%9B%BE%E7%89%87.png")).toBe("图片.png");
  });

  it("generates png filename from content type when extension missing", () => {
    vi.spyOn(Date, "now").mockReturnValue(1710000000000);

    expect(extractFilename("https://example.com/path/image", "image/png")).toBe(
      "web-image-1710000000000.png",
    );
  });

  it("generates jpg filename when extension and content type missing", () => {
    vi.spyOn(Date, "now").mockReturnValue(1710000000001);

    expect(extractFilename("https://example.com/path/image")).toBe("web-image-1710000000001.jpg");
  });

  it("falls back to generated filename for invalid URL", () => {
    vi.spyOn(Date, "now").mockReturnValue(1710000000002);

    expect(extractFilename("not-a-valid-url")).toBe("web-image-1710000000002.jpg");
  });
});

describe("getExtensionFromContentType", () => {
  it("maps known image content types", () => {
    expect(getExtensionFromContentType("image/png")).toBe(".png");
    expect(getExtensionFromContentType("image/jpeg")).toBe(".jpg");
    expect(getExtensionFromContentType("image/gif")).toBe(".gif");
    expect(getExtensionFromContentType("image/svg+xml")).toBe(".svg");
    expect(getExtensionFromContentType("image/webp")).toBe(".webp");
  });

  it("returns jpg for undefined and unknown content types", () => {
    expect(getExtensionFromContentType(undefined)).toBe(".jpg");
    expect(getExtensionFromContentType("image/bmp")).toBe(".jpg");
  });

  it("is case insensitive", () => {
    expect(getExtensionFromContentType("IMAGE/PNG")).toBe(".png");
  });
});
