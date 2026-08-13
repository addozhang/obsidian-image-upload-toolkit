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
    "![image](https://mmbiz.qpic.cn/mmbiz_svg/Q3auHgzwzM4xmCJEFEWXFbXXHia3ibH7U4RLVfQzuRjs2icgedowztV9fIB3Vsrrzt53YVkIGn2Q5dehvaWrUib8GaeHWAqYdzOJvBrxraoKfAicZBVw2wK8Htg/640?wx_fmt=svg&from=appmsg&tp=webp&wxfrom=5&wx_lazy=1#imgIndex=1)",
  ];

  const nonMatches = ["![alt](file.pdf)", "![alt](file.txt)"];

  it("matches supported markdown image formats", () => {
    const regex = fresh(MD_REGEX);

    for (const input of matches) {
      expect(regex.test(input)).toBe(true);
      regex.lastIndex = 0;
    }
  });

  it("matches markdown image syntax regardless of extension", () => {
    const regex = fresh(MD_REGEX);

    for (const input of nonMatches) {
      expect(regex.test(input)).toBe(true);
      regex.lastIndex = 0;
    }
  });

  it("captures alt and full path groups", () => {
    const regex = fresh(MD_REGEX);
    const match = regex.exec("![my alt](path/to/file.jpeg)");

    expect(match?.[1]).toBe("my alt");
    expect(match?.[2]).toBe("path/to/file.jpeg");
  });

  it("captures alt and url for web images without extension", () => {
    const regex = fresh(MD_REGEX);
    const match = regex.exec("![image](https://mmbiz.qpic.cn/mmbiz_svg/Q3auHgzwzM4xmCJEFEWXFbXXHia3ibH7U4RLVfQzuRjs2icgedowztV9fIB3Vsrrzt53YVkIGn2Q5dehvaWrUib8GaeHWAqYdzOJvBrxraoKfAicZBVw2wK8Htg/640?wx_fmt=svg&from=appmsg&tp=webp&wxfrom=5&wx_lazy=1#imgIndex=1)");

    expect(match?.[1]).toBe("image");
    expect(match?.[2]).toBe("https://mmbiz.qpic.cn/mmbiz_svg/Q3auHgzwzM4xmCJEFEWXFbXXHia3ibH7U4RLVfQzuRjs2icgedowztV9fIB3Vsrrzt53YVkIGn2Q5dehvaWrUib8GaeHWAqYdzOJvBrxraoKfAicZBVw2wK8Htg/640?wx_fmt=svg&from=appmsg&tp=webp&wxfrom=5&wx_lazy=1#imgIndex=1");
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

  it("does not merge multiple wikilink images on the same line (issue #87)", () => {
    const cases = [
      "![[1000342477.jpg]]![[1000342476.png]]",
      "![[1000342477.jpg]]       ![[1000342476.png]]",
      "![[1000342477.jpg]] even with words here ![[1000342476.png]]",
    ];

    for (const input of cases) {
      const regex = fresh(WIKI_REGEX);
      const found = [...input.matchAll(regex)];

      expect(found).toHaveLength(2);
      expect(found[0][1]).toBe("1000342477.jpg");
      expect(found[1][1]).toBe("1000342476.png");
      // Neither match should swallow the other tag's closing brackets.
      expect(found[0][0]).not.toContain("1000342476");
      expect(found[1][0]).not.toContain("1000342477");
    }
  });

  it("still supports alias/size suffix without swallowing a following image", () => {
    const regex = fresh(WIKI_REGEX);
    const found = [..."![[photo.jpg|500]]![[other.png]]".matchAll(regex)];

    expect(found).toHaveLength(2);
    expect(found[0][1]).toBe("photo.jpg");
    expect(found[0][4]).toBe("|500");
    expect(found[1][1]).toBe("other.png");
  });

  it("supports Obsidian's #fragment (CSS-class) suffix on embeds", () => {
    const regex = fresh(WIKI_REGEX);
    const match = regex.exec("![[Engelbart.jpg#outline]]");

    expect(match?.[1]).toBe("Engelbart.jpg");
  });

  it("supports combined #fragment and |size suffix without swallowing a following image", () => {
    const regex = fresh(WIKI_REGEX);
    const found = [
      ..."![[Engelbart.jpg#outline|100]]![[other.png]]".matchAll(regex),
    ];

    expect(found).toHaveLength(2);
    expect(found[0][1]).toBe("Engelbart.jpg");
    expect(found[0][3]).toBe("#outline");
    expect(found[0][4]).toBe("|100");
    expect(found[1][1]).toBe("other.png");
  });

  it("matches uppercase extensions case-insensitively", () => {
    const regex = fresh(WIKI_REGEX);
    const found = [..."![[IMAGE.PNG]]![[photo.JPG]]".matchAll(regex)];

    expect(found).toHaveLength(2);
    expect(found[0][1]).toBe("IMAGE.PNG");
    expect(found[1][1]).toBe("photo.JPG");
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
