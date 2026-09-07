import {afterEach, describe, expect, it, vi} from "vitest";
import * as obsidian from "obsidian";
import ApiError from "../../src/uploader/apiError";
import ImgurAnonymousUploader from "../../src/uploader/imgur/imgurAnonymousUploader";
import {IMGUR_API_BASE} from "../../src/uploader/imgur/constants";

describe("ImgurAnonymousUploader", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("posts base64 form data with the client id and returns the link", async () => {
        const requestSpy = vi.spyOn(obsidian, "requestUrl").mockResolvedValue({
            status: 200,
            json: {data: {link: "https://i.imgur.com/abc.png"}},
            text: "",
            headers: {},
        } as any);

        const uploader = new ImgurAnonymousUploader("client-id");
        const url = await uploader.upload(new File(["x"], "a.png", {type: "image/png"}), "a.png");

        expect(url).toBe("https://i.imgur.com/abc.png");
        const call = requestSpy.mock.calls[0][0];
        expect(call.url).toBe(`${IMGUR_API_BASE}image`);
        expect(call.headers.Authorization).toBe("Client-ID client-id");
        expect(call.body).toContain("type=base64");
        expect(call.body).toContain(`image=${encodeURIComponent(btoa("x"))}`);
    });

    it("throws ApiError with the json error message", async () => {
        vi.spyOn(obsidian, "requestUrl").mockResolvedValue({
            status: 429,
            json: {data: {error: "Rate limit exceeded"}},
            text: "",
            headers: {"Content-Type": "application/json"},
        } as any);

        const uploader = new ImgurAnonymousUploader("client-id");
        const err = await uploader.upload(new File(["x"], "a.png"), "a.png").catch((e: unknown) => e);
        expect(err).toBeInstanceOf(ApiError);
        expect((err as ApiError).message).toBe("Rate limit exceeded");
    });

    it("falls back to the response text for non-json errors", async () => {
        vi.spyOn(obsidian, "requestUrl").mockResolvedValue({
            status: 502,
            json: undefined,
            text: "Bad gateway",
            headers: {},
        } as any);

        const uploader = new ImgurAnonymousUploader("client-id");
        await expect(uploader.upload(new File(["x"], "a.png"), "a.png")).rejects.toThrow("Bad gateway");
    });
});
