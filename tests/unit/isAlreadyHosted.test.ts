import { describe, expect, it } from "vitest";
import { isAlreadyHosted } from "../../src/uploader/imageTagProcessor";
import type { PublishSettings } from "../../src/publish";

const makeSettings = (overrides: any) =>
  ({
    imageStore: "imgur",
    githubSetting: { repositoryName: "" },
    ossSetting: { customDomainName: "" },
    awsS3Setting: { customDomainName: "" },
    cosSetting: { customDomainName: "" },
    kodoSetting: { customDomainName: "" },
    r2Setting: { customDomainName: "" },
    ...overrides,
  }) as any as PublishSettings;

describe("isAlreadyHosted", () => {
  it("imgur provider", () => {
    const settings = makeSettings({ imageStore: "imgur" });

    expect(isAlreadyHosted("https://i.imgur.com/abc123.png", settings)).toBe(true);
    expect(isAlreadyHosted("https://example.com/img.png", settings)).toBe(false);
  });

  it("github provider with repository name", () => {
    const settings = makeSettings({
      imageStore: "github",
      githubSetting: { repositoryName: "my-images" },
    });

    expect(isAlreadyHosted("https://github.com/user/my-images/blob/main/img.png", settings)).toBe(true);
  });

  it("github provider without repository name", () => {
    const settings = makeSettings({
      imageStore: "github",
      githubSetting: { repositoryName: "" },
    });

    expect(isAlreadyHosted("https://githubusercontent.com/img.png", settings)).toBe(true);
  });

  it("oss provider default and custom domain", () => {
    const defaultSettings = makeSettings({ imageStore: "oss" });
    const customSettings = makeSettings({ imageStore: "oss", ossSetting: { customDomainName: "cdn.oss.local" } });

    expect(isAlreadyHosted("https://bucket.oss-cn-hangzhou.aliyuncs.com/img.png", defaultSettings)).toBe(true);
    expect(isAlreadyHosted("https://cdn.oss.local/img.png", customSettings)).toBe(true);
  });

  it("s3 provider default and custom domain and s3 hostname", () => {
    const defaultSettings = makeSettings({ imageStore: "s3" });
    const customSettings = makeSettings({ imageStore: "s3", awsS3Setting: { customDomainName: "cdn.s3.local" } });

    expect(isAlreadyHosted("https://bucket.s3.amazonaws.com/img.png", defaultSettings)).toBe(true);
    expect(isAlreadyHosted("https://images.s3.local/img.png", defaultSettings)).toBe(true);
    expect(isAlreadyHosted("https://cdn.s3.local/img.png", customSettings)).toBe(true);
  });

  it("cos provider default and custom domain", () => {
    const defaultSettings = makeSettings({ imageStore: "cos" });
    const customSettings = makeSettings({ imageStore: "cos", cosSetting: { customDomainName: "cdn.cos.local" } });

    expect(isAlreadyHosted("https://bucket-123.cos.ap-guangzhou.myqcloud.com/img.png", defaultSettings)).toBe(true);
    expect(isAlreadyHosted("https://cdn.cos.local/img.png", customSettings)).toBe(true);
  });

  it("qiniu provider default domains and custom domain", () => {
    const defaultSettings = makeSettings({ imageStore: "qiniu" });
    const customSettings = makeSettings({ imageStore: "qiniu", kodoSetting: { customDomainName: "cdn.qiniu.local" } });

    expect(isAlreadyHosted("https://abc.qiniudn.com/img.png", defaultSettings)).toBe(true);
    expect(isAlreadyHosted("https://abc.clouddn.com/img.png", defaultSettings)).toBe(true);
    expect(isAlreadyHosted("https://cdn.qiniu.local/img.png", customSettings)).toBe(true);
  });

  it("imagekit provider", () => {
    const settings = makeSettings({ imageStore: "imagekit" });

    expect(isAlreadyHosted("https://ik.imagekit.io/account/img.png", settings)).toBe(true);
  });

  it("r2 provider defaults and custom domain", () => {
    const defaultSettings = makeSettings({ imageStore: "r2" });
    const customSettings = makeSettings({ imageStore: "r2", r2Setting: { customDomainName: "cdn.r2.local" } });

    expect(isAlreadyHosted("https://bucket.r2.dev/img.png", defaultSettings)).toBe(true);
    expect(isAlreadyHosted("https://bucket.r2.cloudflarestorage.com/img.png", defaultSettings)).toBe(true);
    expect(isAlreadyHosted("https://cdn.r2.local/img.png", customSettings)).toBe(true);
  });

  it("b2 provider falls through to false", () => {
    const settings = makeSettings({ imageStore: "b2" });

    expect(isAlreadyHosted("https://f004.backblazeb2.com/file/bucket/img.png", settings)).toBe(false);
  });

  it("unknown provider returns false", () => {
    const settings = makeSettings({ imageStore: "unknown-store" });

    expect(isAlreadyHosted("https://example.com/img.png", settings)).toBe(false);
  });

  it("invalid URL returns false", () => {
    const settings = makeSettings({ imageStore: "imgur" });

    expect(isAlreadyHosted("not a valid url", settings)).toBe(false);
  });
});
