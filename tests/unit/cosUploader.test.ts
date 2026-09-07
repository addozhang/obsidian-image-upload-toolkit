import {afterEach, describe, expect, it, vi} from "vitest";
import * as obsidian from "obsidian";
import CosUploader, {CosSetting} from "../../src/uploader/cos/cosUploader";

function baseSetting(overrides: Partial<CosSetting> = {}): CosSetting {
    return {
        region: "ap-guangzhou",
        bucket: "blog-1250000000",
        secretId: "id",
        secretKey: "key",
        path: "",
        customDomainName: "",
        ...overrides,
    };
}

describe("CosUploader", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("builds the bucket URL and q-sign authorization", async () => {
        const requestSpy = vi.spyOn(obsidian, "requestUrl").mockResolvedValue({status: 200, text: ""} as any);

        const uploader = new CosUploader(baseSetting());
        const url = await uploader.upload(new File(["x"], "a.png", {type: "image/png"}), "a.png");

        expect(url).toBe("https://blog-1250000000.cos.ap-guangzhou.myqcloud.com/a.png");
        const headers = requestSpy.mock.calls[0][0].headers;
        expect(headers.Authorization).toContain("q-sign-algorithm=sha1");
        expect(headers.Authorization).toContain("q-ak=id");
        expect(headers.Authorization).toContain("q-header-list=host");
        // Host header must NOT be set explicitly (Electron forbids it)
        expect(headers.Host).toBeUndefined();
    });

    it("percent-encodes path segments in the URL", async () => {
        const requestSpy = vi.spyOn(obsidian, "requestUrl").mockResolvedValue({status: 200, text: ""} as any);

        const uploader = new CosUploader(baseSetting({path: "{filename}"}));
        const url = await uploader.upload(new File(["x"], "图片 名.png"), "图片 名.png");

        expect(url).toContain("%E5%9B%BE%E7%89%87%20%E5%90%8D.png");
        expect(url).not.toContain("图片 名.png");
    });

    it("applies a custom domain to the returned url", async () => {
        vi.spyOn(obsidian, "requestUrl").mockResolvedValue({status: 200, text: ""} as any);

        const uploader = new CosUploader(baseSetting({customDomainName: "cdn.example.com"}));
        const url = await uploader.upload(new File(["x"], "a.png"), "a.png");

        expect(url).toBe("https://cdn.example.com/a.png");
    });

    it("throws with the status code on failed upload", async () => {
        vi.spyOn(obsidian, "requestUrl").mockResolvedValue({status: 500, text: "oops"} as any);

        const uploader = new CosUploader(baseSetting());
        await expect(uploader.upload(new File(["x"], "a.png"), "a.png")).rejects.toThrow(/500/);
    });
});
