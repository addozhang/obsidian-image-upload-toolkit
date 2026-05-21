import { afterEach, describe, expect, it, vi } from "vitest";
import { UploaderUtils } from "../../src/uploader/uploaderUtils";

describe("UploaderUtils.generateName", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("replaces year month day variables", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-17T08:00:00.000Z"));

    const result = UploaderUtils.generateName("/{year}/{mon}/{day}/image.png", "ignored.png");

    expect(result).toBe("/2024/01/17/image.png");
  });

  it("replaces random variable deterministically", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);

    const result = UploaderUtils.generateName("{random}", "ignored.png");

    expect(result).toBe("A".repeat(20));
  });

  it("replaces filename variable", () => {
    const result = UploaderUtils.generateName("uploads/{filename}", "photo.jpg");

    expect(result).toBe("uploads/photo.jpg");
  });

  it("replaces all variables together", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-17T08:00:00.000Z"));
    vi.spyOn(Math, "random").mockReturnValue(0);

    const result = UploaderUtils.generateName("{year}/{mon}/{day}/{random}/{filename}", "image.webp");

    expect(result).toBe(`2024/01/17/${"A".repeat(20)}/image.webp`);
  });

  it("returns image name when template is undefined", () => {
    const result = UploaderUtils.generateName(undefined as unknown as string, "keep.png");

    expect(result).toBe("keep.png");
  });

  it("returns image name when template is whitespace", () => {
    const result = UploaderUtils.generateName("   ", "keep.png");

    expect(result).toBe("keep.png");
  });
});

describe("UploaderUtils.customizeDomainName", () => {
  it("replaces domain for normal URL", () => {
    const result = UploaderUtils.customizeDomainName(
      "https://old.example.com/path/file.png",
      "cdn.example.com",
    );

    expect(result).toBe("https://cdn.example.com/path/file.png");
  });

  it("strips https prefix from custom domain before replacing", () => {
    const result = UploaderUtils.customizeDomainName(
      "https://old.example.com/path/file.png",
      "https://cdn.example.com",
    );

    expect(result).toBe("https://cdn.example.com/path/file.png");
  });

  it("returns original URL for empty custom domain", () => {
    const result = UploaderUtils.customizeDomainName("https://old.example.com/path/file.png", "");

    expect(result).toBe("https://old.example.com/path/file.png");
  });

  it("returns original URL for whitespace custom domain", () => {
    const result = UploaderUtils.customizeDomainName("https://old.example.com/path/file.png", "   ");

    expect(result).toBe("https://old.example.com/path/file.png");
  });

  it("wraps key-like URL with https and custom domain", () => {
    const result = UploaderUtils.customizeDomainName("path/to/file.png", "cdn.example.com");

    expect(result).toBe("https://cdn.example.com/path/to/file.png");
  });

  it("keeps trailing slash behavior of custom domain", () => {
    const result = UploaderUtils.customizeDomainName(
      "https://old.example.com/path/file.png",
      "cdn.example.com/",
    );

    expect(result).toBe("https://cdn.example.com//path/file.png");
  });
});

describe("UploaderUtils.trimCredential", () => {
  it("strips trailing newline (the #58 footgun)", () => {
    expect(UploaderUtils.trimCredential("secret-key\n")).toBe("secret-key");
  });

  it("strips leading and trailing whitespace", () => {
    expect(UploaderUtils.trimCredential("  AKIA1234  ")).toBe("AKIA1234");
  });

  it("strips internal-edge tabs and CRLF", () => {
    expect(UploaderUtils.trimCredential("\tdeadbeef\r\n")).toBe("deadbeef");
  });

  it("returns empty string for undefined input", () => {
    expect(UploaderUtils.trimCredential(undefined)).toBe("");
  });

  it("returns empty string for null input", () => {
    expect(UploaderUtils.trimCredential(null)).toBe("");
  });

  it("returns empty string for empty input", () => {
    expect(UploaderUtils.trimCredential("")).toBe("");
  });

  it("preserves internal whitespace (does not collapse)", () => {
    // unlikely for AWS keys but spec the behavior
    expect(UploaderUtils.trimCredential("  a b  ")).toBe("a b");
  });
});

describe("UploaderUtils.normalizeEndpoint", () => {
  it("strips a single trailing slash", () => {
    expect(UploaderUtils.normalizeEndpoint("https://account.r2.cloudflarestorage.com/"))
      .toBe("https://account.r2.cloudflarestorage.com");
  });

  it("strips multiple trailing slashes", () => {
    expect(UploaderUtils.normalizeEndpoint("https://account.r2.cloudflarestorage.com///"))
      .toBe("https://account.r2.cloudflarestorage.com");
  });

  it("leaves endpoint without trailing slash unchanged", () => {
    expect(UploaderUtils.normalizeEndpoint("https://account.r2.cloudflarestorage.com"))
      .toBe("https://account.r2.cloudflarestorage.com");
  });

  it("trims whitespace and trailing slash together", () => {
    expect(UploaderUtils.normalizeEndpoint("  https://s3.example.com/  "))
      .toBe("https://s3.example.com");
  });

  it("returns empty string for undefined", () => {
    expect(UploaderUtils.normalizeEndpoint(undefined)).toBe("");
  });

  it("returns empty string for null", () => {
    expect(UploaderUtils.normalizeEndpoint(null)).toBe("");
  });
});
