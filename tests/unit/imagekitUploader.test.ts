import {afterEach, describe, expect, it, vi} from "vitest";
import * as obsidian from "obsidian";
import ImagekitUploader, {ImagekitSetting} from "../../src/uploader/imagekit/imagekitUploader";

function baseSetting(overrides: Partial<ImagekitSetting> = {}): ImagekitSetting {
    return {
        folder: "",
        imagekitID: "id",
        publicKey: "pk",
        privateKey: "sk",
        endpoint: "",
        ...overrides,
    };
}

describe("ImagekitUploader", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("posts base64 file data with basic auth and returns the cdn url", async () => {
        const requestSpy = vi.spyOn(obsidian, "requestUrl").mockResolvedValue({
            status: 200,
            json: {url: "https://ik.imagekit.io/id/a.png"},
            text: "",
        } as any);

        const uploader = new ImagekitUploader(baseSetting());
        const url = await uploader.upload(new File(["x"], "a.png", {type: "image/png"}), "a.png");

        expect(url).toBe("https://ik.imagekit.io/id/a.png");
        const call = requestSpy.mock.calls[0][0];
        expect(call.url).toBe("https://upload.imagekit.io/api/v1/files/upload");
        expect(call.headers.Authorization).toBe(`Basic ${Buffer.from("sk:").toString("base64")}`);
        expect(call.body).toContain('name="fileName"');
        expect(call.body).toContain("a.png");
    });

    it("includes a trimmed folder field when configured", async () => {
        const requestSpy = vi.spyOn(obsidian, "requestUrl").mockResolvedValue({
            status: 200,
            json: {url: "https://ik.imagekit.io/id/a.png"},
            text: "",
        } as any);

        const uploader = new ImagekitUploader(baseSetting({folder: " /blog/ "}));
        await uploader.upload(new File(["x"], "a.png"), "a.png");

        expect(requestSpy.mock.calls[0][0].body).toContain('name="folder"\r\n\r\n/blog/');
    });

    it("omits the folder field when not configured", async () => {
        const requestSpy = vi.spyOn(obsidian, "requestUrl").mockResolvedValue({
            status: 200,
            json: {url: "https://ik.imagekit.io/id/a.png"},
            text: "",
        } as any);

        const uploader = new ImagekitUploader(baseSetting());
        await uploader.upload(new File(["x"], "a.png"), "a.png");

        expect(requestSpy.mock.calls[0][0].body).not.toContain('name="folder"');
    });

    it("surfaces the api error message on failure", async () => {
        vi.spyOn(obsidian, "requestUrl").mockResolvedValue({
            status: 401,
            json: {message: "Invalid private key"},
            text: "",
        } as any);

        const uploader = new ImagekitUploader(baseSetting());
        await expect(uploader.upload(new File(["x"], "a.png"), "a.png")).rejects.toThrow(/401.*Invalid private key/s);
    });

    it("throws when the success response lacks a url", async () => {
        vi.spyOn(obsidian, "requestUrl").mockResolvedValue({status: 200, json: {}, text: ""} as any);

        const uploader = new ImagekitUploader(baseSetting());
        await expect(uploader.upload(new File(["x"], "a.png"), "a.png")).rejects.toThrow(/missing 'url'/);
    });
});
