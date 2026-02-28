import ImageUploader from "../imageUploader";
import { requestUrl } from "obsidian";
import ApiError from "../apiError";

export default class ImagekitUploader implements ImageUploader {
    private readonly setting!: ImagekitSetting;

    constructor(setting: ImagekitSetting) {
        this.setting = setting;
    }

    async upload(image: File, fullPath: string): Promise<string> {
        // Use Obsidian's requestUrl instead of the imagekit SDK.
        // The SDK uses Node.js native HTTP which conflicts with Obsidian's Electron sandbox,
        // causing AsyncResource wild pointer access → SIGSEGV crash on upload.
        const arrayBuffer = await image.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString("base64");
        const mimeType = image.type || "application/octet-stream";
        const fileData = `data:${mimeType};base64,${base64}`;
        const authHeader =
            "Basic " + Buffer.from(this.setting.privateKey + ":").toString("base64");

        const boundary = "----ObsidianImageKit" + Date.now().toString(36);
        const fields: Record<string, string> = {
            file: fileData,
            fileName: image.name,
        };

        if (this.setting.folder?.trim()) {
            fields.folder = this.setting.folder.trim();
        }

        let body = "";
        for (const [key, value] of Object.entries(fields)) {
            body += `--${boundary}\r\n`;
            body += `Content-Disposition: form-data; name="${key}"\r\n\r\n`;
            body += `${value}\r\n`;
        }
        body += `--${boundary}--\r\n`;

        const response = await requestUrl({
            url: "https://upload.imagekit.io/api/v1/files/upload",
            method: "POST",
            headers: {
                Authorization: authHeader,
                "Content-Type": `multipart/form-data; boundary=${boundary}`,
            },
            body: body,
        });

        if (response.status !== 200) {
            const errMsg = response.json?.message || response.text;
            throw new ApiError(`ImageKit upload failed (${response.status}): ${errMsg}`);
        }

        return response.json.url;
    }
}

export interface ImagekitSetting {
    folder: string;
    imagekitID: string;
    publicKey: string;
    privateKey: string;
    endpoint: string;
}
