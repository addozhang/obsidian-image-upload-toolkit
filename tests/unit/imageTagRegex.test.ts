import { describe, expect, it } from "vitest";
import { MD_REGEX, PROPERTIES_REGEX, WIKI_REGEX } from "../../src/uploader/imageTagProcessor";

const fresh = (regex: RegExp) => new RegExp(regex.source, regex.flags);

describe("MD_REGEX", () => {
  const matches = [
    "![alt](image.png)",
    "![](photo.jpg)",
    "![name](path/to/file.jpeg)",
    "![alt](image.gif)",
    "![alt](image.svg)",
    "![alt](image.webp)",
    "![alt](drawing.excalidraw)",
    "![alt](http://example.com/img.png)",
  ];

  const nonMatches = ["![alt](file.pdf)", "![alt](file.txt)"];

  it("matches supported markdown image formats", () => {
    const regex = fresh(MD_REGEX);

    for (const input of matches) {
      expect(regex.test(input)).toBe(true);
      regex.lastIndex = 0;
    }
  });

  it("does not match unsupported markdown image formats", () => {
    const regex = fresh(MD_REGEX);

    for (const input of nonMatches) {
      expect(regex.test(input)).toBe(false);
      regex.lastIndex = 0;
    }
  });

  it("captures alt full path and extension groups", () => {
    const regex = fresh(MD_REGEX);
    const match = regex.exec("![my alt](path/to/file.jpeg)");

    expect(match?.[1]).toBe("my alt");
    expect(match?.[2]).toBe("path/to/file.jpeg");
    expect(match?.[3]).toBe("jpeg");
  });
});

describe("WIKI_REGEX", () => {
  const matches = [
    "![[image.png]]",
    "![[photo.jpg|500]]",
    "![[path/to/file.jpeg]]",
    "![[drawing.excalidraw]]",
  ];

  const nonMatches = ["![[file.pdf]]", "![[note]]", "[[image.png]]"];

  it("matches supported wikilink image formats", () => {
    const regex = fresh(WIKI_REGEX);

    for (const input of matches) {
      expect(regex.test(input)).toBe(true);
      regex.lastIndex = 0;
    }
  });

  it("does not match unsupported wikilink formats", () => {
    const regex = fresh(WIKI_REGEX);

    for (const input of nonMatches) {
      expect(regex.test(input)).toBe(false);
      regex.lastIndex = 0;
    }
  });

  it("captures filename with extension in group 1", () => {
    const regex = fresh(WIKI_REGEX);
    const match = regex.exec("![[path/to/file.jpeg|500]]");

    expect(match?.[1]).toBe("path/to/file.jpeg");
  });
});

describe("PROPERTIES_REGEX", () => {
  it("matches YAML frontmatter at start", () => {
    const input = "---\ntitle: test\n---\ncontent";
    const match = PROPERTIES_REGEX.exec(input);

    expect(match?.[0]).toBe("---\ntitle: test\n---\n");
  });

  it("does not match when frontmatter is absent", () => {
    const input = "title: test\ncontent";

    expect(PROPERTIES_REGEX.test(input)).toBe(false);
  });

  it("does not match when delimiter is not at start", () => {
    const input = "content\n---\ntitle: test\n---\n";

    expect(PROPERTIES_REGEX.test(input)).toBe(false);
  });
});
