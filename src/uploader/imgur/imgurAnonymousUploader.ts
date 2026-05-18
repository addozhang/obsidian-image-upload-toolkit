import ImageUploader from "../imageUploader";
import {IMGUR_API_BASE} from "./constants";
import {ImgurErrorData, ImgurPostData} from "./imgurResponseTypes";
import {requestUrl, RequestUrlResponse} from "obsidian";
import ApiError from "../apiError";

export default class ImgurAnonymousUploader implements ImageUploader {
    private readonly clientId!: string;

    constructor(clientId: string) {
        this.clientId = clientId;
    }

    async upload(image: File, path: string): Promise<string> {
        // Imgur /3/image accepts base64-encoded image bytes when the request
        // body is application/x-www-form-urlencoded with the `image` field.
        // requestUrl() does not support multipart/form-data, so use base64.
        const buf = await image.arrayBuffer();
        const bytes = new Uint8Array(buf);
        let binary = "";
        for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        const b64 = btoa(binary);
        const body = `image=${encodeURIComponent(b64)}&type=base64`;

        const resp = await requestUrl({
            body,
            headers: {
                Authorization: `Client-ID ${this.clientId}`,
                "Content-Type": "application/x-www-form-urlencoded",
            },
            method: "POST",
            throw: false,
            url: `${IMGUR_API_BASE}image`,
        });

        if (resp.status != 200) {
            handleImgurErrorResponse(resp);
        }
        return (resp.json as ImgurPostData).data.link;
    }
}

export interface ImgurAnonymousSetting {
    clientId: string;
}

export function handleImgurErrorResponse(resp: RequestUrlResponse): void {
    const contentType = resp.headers["Content-Type"] || resp.headers["content-type"];
    if (contentType && contentType.startsWith("application/json")) {
        throw new ApiError((resp.json as ImgurErrorData).data.error);
    }
    throw new Error(resp.text || `Imgur upload failed: HTTP ${resp.status}`);
}
