import {afterEach, describe, expect, it, vi} from "vitest";
import * as obsidian from "obsidian";
import OssUploader, {OssSetting} from "../../src/uploader/oss/ossUploader";

function baseSetting(overrides: Partial<OssSetting> = {}): OssSetting {
    return {
        region: "oss-cn-hangzhou",
        accessKeyId: "key",
        accessKeySecret: "secret",
        bucket: "blog",
        endpoint: "https://oss-cn-hangzhou.aliyuncs.com/",
        path: "",
        customDomainName: "",
        ...overrides,
    };
}

describe("OssUploader", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("builds the virtual-hosted URL from bucket and region", async () => {
        const requestSpy = vi.spyOn(obsidian, "requestUrl").mockResolvedValue({status: 200, text: ""} as any);

        const uploader = new OssUploader(baseSetting());
        const url = await uploader.upload(new File(["x"], "a.png", {type: "image/png"}), "a.png");

        expect(url).toBe("https://blog.oss-cn-hangzhou.aliyuncs.com/a.png");
        expect(requestSpy.mock.calls[0][0].method).toBe("PUT");
        expect(requestSpy.mock.calls[0][0].headers.Authorization).toMatch(/^OSS key:/);
    });

    it("applies the path template to the object key", async () => {
        const requestSpy = vi.spyOn(obsidian, "requestUrl").mockResolvedValue({status: 200, text: ""} as any);

        const uploader = new OssUploader(baseSetting({path: "{year}/{filename}"}));
        await uploader.upload(new File(["x"], "a.png", {type: "image/png"}), "a.png");

        expect(requestSpy.mock.calls[0][0].url).toMatch(/^https:\/\/blog\.oss-cn-hangzhou\.aliyuncs\.com\/\d{4}\/a\.png$/);
    });

    it("swaps the host when a custom domain is configured", async () => {
        vi.spyOn(obsidian, "requestUrl").mockResolvedValue({status: 200, text: ""} as any);

        const uploader = new OssUploader(baseSetting({customDomainName: "cdn.example.com"}));
        const url = await uploader.upload(new File(["x"], "a.png", {type: "image/png"}), "a.png");

        expect(url).toBe("https://cdn.example.com/a.png");
    });

    it("throws with the status code on failed upload", async () => {
        vi.spyOn(obsidian, "requestUrl").mockResolvedValue({status: 403, text: "denied"} as any);

        const uploader = new OssUploader(baseSetting());
        await expect(uploader.upload(new File(["x"], "a.png"), "a.png")).rejects.toThrow(/403/);
    });
});
