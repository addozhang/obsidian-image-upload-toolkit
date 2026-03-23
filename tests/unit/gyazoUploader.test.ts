import {afterEach, describe, expect, it, vi} from "vitest";
import * as obsidian from "obsidian";
import ApiError from "../../src/uploader/apiError";
import GyazoUploader from "../../src/uploader/gyazo/gyazoUploader";

function getBodyText(body: ArrayBuffer | Uint8Array | string): string {
    if (typeof body === "string") {
        return body;
    }

    const bytes = body instanceof Uint8Array ? body : new Uint8Array(body);
    return new TextDecoder().decode(bytes);
}

describe("GyazoUploader", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("uploads an image and returns the direct image url", async () => {
        const requestSpy = vi.spyOn(obsidian, "requestUrl").mockResolvedValue({
            status: 200,
            json: {
                url: "https://i.gyazo.com/8980c52421e452ac3355ca3e5cfe7a0c.png",
            },
            text: "",
        } as any);

        const uploader = new GyazoUploader({
            accessToken: "test-token",
            accessPolicy: "anyone",
            desc: "shared desc",
        });

        const file = new File(["hello"], "image.png", {type: "image/png"});
        const result = await uploader.upload(file, "/tmp/image.png");

        expect(result).toBe("https://i.gyazo.com/8980c52421e452ac3355ca3e5cfe7a0c.png");
        expect(requestSpy).toHaveBeenCalledTimes(1);

        const request = requestSpy.mock.calls[0][0];
        expect(request.url).toBe("https://upload.gyazo.com/api/upload");
        expect(request.method).toBe("POST");
        expect(request.headers.Authorization).toBe("Bearer test-token");
        expect(request.headers["Content-Type"]).toContain("multipart/form-data; boundary=");

        const bodyText = getBodyText(request.body);
        expect(bodyText).toContain('name="imagedata"; filename="image.png"');
        expect(bodyText).toContain("Content-Type: image/png");
        expect(bodyText).toContain('name="access_policy"');
        expect(bodyText).toContain("anyone");
        expect(bodyText).toContain('name="desc"');
        expect(bodyText).toContain("shared desc");
    });

    it("omits desc when the setting is empty", async () => {
        const requestSpy = vi.spyOn(obsidian, "requestUrl").mockResolvedValue({
            status: 200,
            json: {
                url: "https://i.gyazo.com/abc.png",
            },
            text: "",
        } as any);

        const uploader = new GyazoUploader({
            accessToken: "test-token",
            accessPolicy: "only_me",
            desc: "   ",
        });

        await uploader.upload(new File(["hello"], "image.png"), "/tmp/image.png");

        const request = requestSpy.mock.calls[0][0];
        const bodyText = getBodyText(request.body);
        expect(bodyText).toContain("only_me");
        expect(bodyText).not.toContain('name="desc"');
    });

    it("throws ApiError with gyazo message on failure", async () => {
        vi.spyOn(obsidian, "requestUrl").mockResolvedValue({
            status: 401,
            json: {
                message: "This method requires authentication",
            },
            text: "",
        } as any);

        const uploader = new GyazoUploader({
            accessToken: "bad-token",
            accessPolicy: "anyone",
            desc: "",
        });

        await expect(uploader.upload(new File(["hello"], "image.png"), "/tmp/image.png"))
            .rejects.toEqual(new ApiError("Gyazo upload failed (401): This method requires authentication"));
    });

    it("throws when the response is missing url", async () => {
        vi.spyOn(obsidian, "requestUrl").mockResolvedValue({
            status: 200,
            json: {},
            text: "",
        } as any);

        const uploader = new GyazoUploader({
            accessToken: "test-token",
            accessPolicy: "anyone",
            desc: "",
        });

        await expect(uploader.upload(new File(["hello"], "image.png"), "/tmp/image.png"))
            .rejects.toEqual(new ApiError("Gyazo upload succeeded but response missing 'url' field"));
    });
});
