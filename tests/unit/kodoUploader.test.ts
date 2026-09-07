import {afterEach, describe, expect, it, vi} from "vitest";
import * as obsidian from "obsidian";
import KodoUploader, {KodoSetting} from "../../src/uploader/qiniu/kodoUploader";

function baseSetting(overrides: Partial<KodoSetting> = {}): KodoSetting {
    return {
        accessKey: "ak",
        secretKey: "sk",
        bucket: "blog",
        customDomainName: "cdn.example.com",
        path: "",
        ...overrides,
    };
}

function getBodyText(body: unknown): string {
    const bytes = body instanceof Uint8Array ? body : new Uint8Array(body as ArrayBuffer);
    return new TextDecoder().decode(bytes);
}

describe("KodoUploader", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("requires a custom domain name", async () => {
        const uploader = new KodoUploader(baseSetting({customDomainName: ""}));
        await expect(uploader.upload(new File(["x"], "a.png"), "a.png")).rejects.toThrow(/Custom domain/);
    });

    it("uploads multipart and joins the custom domain with the returned key", async () => {
        const requestSpy = vi.spyOn(obsidian, "requestUrl").mockResolvedValue({
            status: 200,
            json: {key: "2026/a.png"},
            text: "",
        } as any);

        const uploader = new KodoUploader(baseSetting());
        const url = await uploader.upload(new File(["x"], "a.png", {type: "image/png"}), "a.png");

        expect(url).toBe("https://cdn.example.com/2026/a.png");
        const body = getBodyText(requestSpy.mock.calls[0][0].body);
        expect(body).toContain('name="token"');
        expect(body).toContain('name="key"');
        expect(requestSpy.mock.calls[0][0].url).toBe("https://upload.qiniup.com");
    });

    it("replaces spaces with underscores in the object key", async () => {
        const requestSpy = vi.spyOn(obsidian, "requestUrl").mockResolvedValue({
            status: 200,
            json: {},
            text: "",
        } as any);

        const uploader = new KodoUploader(baseSetting({path: "{filename}"}));
        await uploader.upload(new File(["x"], "my photo.png"), "my photo.png");

        const body = getBodyText(requestSpy.mock.calls[0][0].body);
        expect(body).toContain("my_photo.png");
    });

    it("issues an upload token scoped to the bucket with a one-hour deadline", () => {
        const uploader = new KodoUploader(baseSetting());
        const before = Math.floor(Date.now() / 1000);
        uploader.updateToken();

        const [accessKey, , encodedPolicy] = uploader["uploadToken"].split(":");
        expect(accessKey).toBe("ak");
        const policy = JSON.parse(
            Buffer.from(encodedPolicy.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"),
        );
        expect(policy.scope).toBe("blog");
        expect(policy.deadline).toBeGreaterThanOrEqual(before + 3600);
    });

    it("throws with the status code on failed upload", async () => {
        vi.spyOn(obsidian, "requestUrl").mockResolvedValue({status: 401, text: "bad token", json: undefined} as any);

        const uploader = new KodoUploader(baseSetting());
        await expect(uploader.upload(new File(["x"], "a.png"), "a.png")).rejects.toThrow(/401/);
    });
});
