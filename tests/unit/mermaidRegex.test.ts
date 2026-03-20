import { describe, expect, it } from "vitest";
import { MERMAID_REGEX } from "../../src/uploader/mermaidProcessor";

const fresh = (regex: RegExp) => new RegExp(regex.source, regex.flags);

describe("MERMAID_REGEX", () => {
  it("matches standard triple-backtick mermaid block", () => {
    const input = "```mermaid\ngraph TD\nA-->B\n```";
    const match = fresh(MERMAID_REGEX).exec(input);

    expect(match).not.toBeNull();
    expect(match?.[1].trim()).toBe("graph TD\nA-->B");
  });

  it("matches triple-tilde mermaid block", () => {
    const input = "~~~mermaid\ngraph TD\nA-->B\n~~~";
    const match = fresh(MERMAID_REGEX).exec(input);

    expect(match).not.toBeNull();
    expect(match?.[1].trim()).toBe("graph TD\nA-->B");
  });

  it("matches with trailing whitespace after mermaid", () => {
    const input = "```mermaid   \ngraph TD\nA-->B\n```";
    const match = fresh(MERMAID_REGEX).exec(input);

    expect(match).not.toBeNull();
    expect(match?.[1].trim()).toBe("graph TD\nA-->B");
  });

  it("matches with CRLF line endings", () => {
    const input = "```mermaid\r\ngraph TD\r\nA-->B\r\n```";
    const match = fresh(MERMAID_REGEX).exec(input);

    expect(match).not.toBeNull();
    expect(match?.[1].trim()).toBe("graph TD\r\nA-->B");
  });

  it("does not match non-mermaid fenced blocks", () => {
    const input = "```javascript\nconst a = 1\n```";

    expect(fresh(MERMAID_REGEX).test(input)).toBe(false);
  });

  it("does not match plain text", () => {
    expect(fresh(MERMAID_REGEX).test("just plain text")).toBe(false);
  });

  it("does not match block without closing fence", () => {
    const input = "```mermaid\ngraph TD\nA-->B";

    expect(fresh(MERMAID_REGEX).test(input)).toBe(false);
  });
});
