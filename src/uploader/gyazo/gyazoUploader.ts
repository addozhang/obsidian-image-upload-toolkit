import {requestUrl} from "obsidian";
import ApiError from "../apiError";
import ImageUploader from "../imageUploader";

const GYAZO_UPLOAD_URL = "https://upload.gyazo.com/api/upload";

export interface GyazoSetting {
    accessToken: string;
    accessPolicy: "anyone" | "only_me";
    desc: string;
}

interface GyazoUploadResponse {
    url?: string;
    message?: string;
}

export default class GyazoUploader implements ImageUploader {
    private readonly setting: GyazoSetting;

    constructor(setting: GyazoSetting) {
        this.setting = setting;
    }

    async upload(image: File, fullPath: string): Promise<string> {
        const boundary = "----ObsidianGyazo" + Date.now().toString(36);
        const body = await this.buildMultipartBody(boundary, image, fullPath);
        const response = await requestUrl({
            url: GYAZO_UPLOAD_URL,
            method: "POST",
            headers: {
                Authorization: `Bearer ${this.setting.accessToken}`,
                "Content-Type": `multipart/form-data; boundary=${boundary}`,
            },
            body,
        });

        if (response.status !== 200) {
            const errorData = response.json as GyazoUploadResponse | undefined;
            const message = errorData?.message || response.text || `Gyazo upload failed (${response.status})`;
            throw new ApiError(`Gyazo upload failed (${response.status}): ${message}`);
        }

        const url = (response.json as GyazoUploadResponse | undefined)?.url;
        if (!url) {
            throw new ApiError("Gyazo upload succeeded but response missing 'url' field");
        }

        return url;
    }

    private async buildMultipartBody(boundary: string, image: File, fullPath: string): Promise<ArrayBuffer> {
        const encoder = new TextEncoder();
        const parts: Uint8Array[] = [];
        const mimeType = image.type || "application/octet-stream";
        const filename = this.getFilename(image, fullPath);

        parts.push(encoder.encode(
            `--${boundary}\r\n` +
            `Content-Disposition: form-data; name="imagedata"; filename="${filename}"\r\n` +
            `Content-Type: ${mimeType}\r\n\r\n`
        ));
        parts.push(new Uint8Array(await image.arrayBuffer()));
        parts.push(encoder.encode("\r\n"));

        parts.push(this.encodeField(boundary, "access_policy", this.setting.accessPolicy));

        if (this.setting.desc.trim()) {
            parts.push(this.encodeField(boundary, "desc", this.setting.desc.trim()));
        }

        parts.push(encoder.encode(`--${boundary}--\r\n`));

        return this.concatParts(parts).buffer;
    }

    private encodeField(boundary: string, name: string, value: string): Uint8Array {
        const encoder = new TextEncoder();
        return encoder.encode(
            `--${boundary}\r\n` +
            `Content-Disposition: form-data; name="${name}"\r\n\r\n` +
            `${value}\r\n`
        );
    }

    private concatParts(parts: Uint8Array[]): Uint8Array {
        const totalLength = parts.reduce((sum, part) => sum + part.length, 0);
        const merged = new Uint8Array(totalLength);
        let offset = 0;

        for (const part of parts) {
            merged.set(part, offset);
            offset += part.length;
        }

        return merged;
    }

    private getFilename(image: File, fullPath: string): string {
        if (image.name) {
            return image.name;
        }

        const pathSegments = fullPath.split(/[\\/]/);
        return pathSegments[pathSegments.length - 1] || "upload.bin";
    }
}
