import { describe, expect, it } from "vitest";
import ImageStore from "../../src/imageStore";

describe("ImageStore registry", () => {
  it("contains all 9 providers", () => {
    expect(ImageStore.lists).toHaveLength(9);
  });

  it("contains specific provider constants", () => {
    const providers = [
      ImageStore.IMGUR,
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
