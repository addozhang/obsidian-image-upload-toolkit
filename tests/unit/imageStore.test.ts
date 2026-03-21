import { describe, expect, it } from "vitest";
import ImageStore from "../../src/imageStore";

describe("ImageStore registry", () => {
  it("contains all 10 providers", () => {
    expect(ImageStore.lists).toHaveLength(10);
  });

  it("contains specific provider constants", () => {
    const providers = [
      ImageStore.IMGUR,
      ImageStore.GYAZO,
      ImageStore.ALIYUN_OSS,
      ImageStore.ImageKit,
      ImageStore.AWS_S3,
      ImageStore.TENCENTCLOUD_COS,
      ImageStore.QINIU_KUDO,
      ImageStore.GITHUB,
      ImageStore.CLOUDFLARE_R2,
      ImageStore.BACKBLAZE_B2,
    ];

    for (const provider of providers) {
      expect(ImageStore.lists).toContain(provider);
      expect(provider.id).toBeTruthy();
      expect(provider.description).toBeTruthy();
    }
  });

  it("normalizes legacy lowercase aliases", () => {
    expect(ImageStore.normalizeId("imgur")).toBe(ImageStore.IMGUR.id);
    expect(ImageStore.normalizeId("gyazo")).toBe(ImageStore.GYAZO.id);
    expect(ImageStore.normalizeId("oss")).toBe(ImageStore.ALIYUN_OSS.id);
    expect(ImageStore.normalizeId("s3")).toBe(ImageStore.AWS_S3.id);
    expect(ImageStore.normalizeId("github")).toBe(ImageStore.GITHUB.id);
    expect(ImageStore.normalizeId("r2")).toBe(ImageStore.CLOUDFLARE_R2.id);
    expect(ImageStore.normalizeId("b2")).toBe(ImageStore.BACKBLAZE_B2.id);
  });

  it("has unique ids with no duplicates", () => {
    const ids = ImageStore.lists.map((store) => store.id);
    const uniqueIds = new Set(ids);

    expect(uniqueIds.size).toBe(ids.length);
  });

  it("each provider has unique id and description pair", () => {
    const pairs = ImageStore.lists.map((store) => `${store.id}:${store.description}`);
    const uniquePairs = new Set(pairs);

    expect(uniquePairs.size).toBe(ImageStore.lists.length);
  });
});
