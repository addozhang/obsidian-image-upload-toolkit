import { describe, expect, it } from "vitest";
import {
  formatUploadedImageReference,
  getHtmlImageReferences,
  HTML_IMG_REGEX,
  isSupportedLocalImagePath,
  MD_REGEX,
  PROPERTIES_REGEX,
  replaceHtmlImageTagSrc,
  resolveRelativeVaultPath,
  WIKI_REGEX,
} from "../../src/uploader/imageTagProcessor";

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
});

describe("HTML_IMG_REGEX", () => {
  it("captures quoted and unquoted src values", () => {
    const html = [
      '<img src="Anexos/files/Pasted image 20260702143718.png" alt="Google Tag Manager">',
      "<img alt='Waterfall' src='Anexos/files/Pasted image 20260702121353.png'>",
      "<img src=Anexos/files/plain.webp loading=lazy>",
    ].join("\n");
    const matches = [...html.matchAll(fresh(HTML_IMG_REGEX))];

    expect(matches.map(match => match[2] || match[3])).toEqual([
      "Anexos/files/Pasted image 20260702143718.png",
      "Anexos/files/Pasted image 20260702121353.png",
      "Anexos/files/plain.webp",
    ]);
  });

  it("returns HTML image references with original tags", () => {
    const imageTag = '<img src="Anexos/files/Pasted image.png" alt="Existing alt">';

    expect(getHtmlImageReferences(imageTag)).toEqual([
      { source: imageTag, src: "Anexos/files/Pasted image.png" },
    ]);
  });
});

describe("HTML image replacement helpers", () => {
  it("preserves HTML attributes and replaces only src", () => {
    const imageTag = '<img alt="Anexos/files/Pasted image.png" src="Anexos/files/Pasted image.png" width="320">';

    expect(replaceHtmlImageTagSrc(imageTag, "https://cdn.example.com/image.png"))
      .toBe('<img alt="Anexos/files/Pasted image.png" src="https://cdn.example.com/image.png" width="320">');
  });

  it("formats HTML references as HTML and markdown references as markdown", () => {
    const uploadedUrl = "https://cdn.example.com/image.png";

    expect(formatUploadedImageReference({
      source: '<img src="Anexos/files/image.png" alt="Existing alt">',
      url: uploadedUrl,
      htmlSrc: "Anexos/files/image.png",
    }, "")).toBe('<img src="https://cdn.example.com/image.png" alt="Existing alt">');
    expect(formatUploadedImageReference({
      source: "![image](Anexos/files/image.png)",
      url: uploadedUrl,
    }, "image")).toBe("![image](https://cdn.example.com/image.png)");
  });

  it("recognizes image paths before query strings and anchors", () => {
    expect(isSupportedLocalImagePath("Anexos/files/Pasted image.png?x=1#hash")).toBe(true);
    expect(isSupportedLocalImagePath("Anexos/files/readme.md")).toBe(false);
  });

  it("resolves note-relative paths with Obsidian vault separators", () => {
    expect(resolveRelativeVaultPath("Anexos/files/Pasted image.png", "Sansung/E-mails/Note.md"))
      .toBe("Sansung/E-mails/Anexos/files/Pasted image.png");
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
