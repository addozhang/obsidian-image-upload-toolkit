import {requestUrl} from "obsidian";
import {createHmac} from "crypto";
import ImageUploader from "../imageUploader";
import {UploaderUtils} from "../uploaderUtils";

const QINIU_UPLOAD_HOST = "https://upload.qiniup.com";
const TOKEN_LIFETIME_SECONDS = 3600;

export default class KodoUploader implements ImageUploader {

    private uploadToken: string;
    private tokenExpireTime: number;
    private setting: KodoSetting;

    constructor(setting: KodoSetting) {
        this.setting = setting;
    }

    async upload(image: File, path: string): Promise<string> {
        //check custom domain name
        if (!this.setting.customDomainName || this.setting.customDomainName.trim() === "") {
            throw new Error("Custom domain name is required for Qiniu Kodo.");
        }
        this.updateToken();
        const key = UploaderUtils.generateName(this.setting.path, image.name.replaceAll(" ", "_"));
        const buffer = Buffer.from(await image.arrayBuffer());

        const boundary = `----ObsidianFormBoundary${Date.now().toString(16)}${Math.random().toString(16).slice(2, 10)}`;
        const body = this.buildMultipartBody(boundary, this.uploadToken, key, image.name, buffer);

        const response = await requestUrl({
            url: QINIU_UPLOAD_HOST,
            method: "POST",
            headers: {
                "Content-Type": `multipart/form-data; boundary=${boundary}`,
            },
            body: body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength),
            throw: false,
        });

        if (response.status !== 200) {
            throw new Error(`Qiniu Kodo upload failed (${response.status}): ${response.text || "no response body"}`);
        }

        const data = response.json as {key?: string};
        const returnedKey = data?.key ?? key;
        return UploaderUtils.customizeDomainName(`${this.setting.customDomainName}/${returnedKey}`, "");
    }

    updateToken(): void {
        if (this.tokenExpireTime && this.tokenExpireTime > Date.now()) {
            return;
        }
        const deadline = Math.floor(Date.now() / 1000) + TOKEN_LIFETIME_SECONDS;
        this.tokenExpireTime = deadline * 1000;
        const policy = {
            scope: this.setting.bucket,
            deadline,
            returnBody:
                '{"key":"$(key)","hash":"$(etag)","bucket":"$(bucket)","name":"$(x:name)","age":$(x:age)}',
        };
        const encodedPolicy = urlSafeBase64(Buffer.from(JSON.stringify(policy), "utf8"));
        const signature = urlSafeBase64(createHmac("sha1", this.setting.secretKey).update(encodedPolicy).digest());
        this.uploadToken = `${this.setting.accessKey}:${signature}:${encodedPolicy}`;
    }

    private buildMultipartBody(
        boundary: string,
        token: string,
        key: string,
        filename: string,
        file: Buffer,
    ): Buffer {
        const CRLF = "\r\n";
        const parts: Buffer[] = [];
        const fieldHeader = (name: string) =>
            `--${boundary}${CRLF}Content-Disposition: form-data; name="${name}"${CRLF}${CRLF}`;

        parts.push(Buffer.from(fieldHeader("token") + token + CRLF, "utf8"));
        parts.push(Buffer.from(fieldHeader("key") + key + CRLF, "utf8"));

        const fileHeader =
            `--${boundary}${CRLF}` +
            `Content-Disposition: form-data; name="file"; filename="${encodeURIComponent(filename)}"${CRLF}` +
            `Content-Type: application/octet-stream${CRLF}${CRLF}`;
        parts.push(Buffer.from(fileHeader, "utf8"));
        parts.push(file);
        parts.push(Buffer.from(`${CRLF}--${boundary}--${CRLF}`, "utf8"));

        return Buffer.concat(parts);
    }
}

function urlSafeBase64(input: Buffer): string {
    return input.toString("base64").replace(/\+/g, "-").replace(/\//g, "_");
}

export interface KodoSetting {
    accessKey: string;
    secretKey: string;
    bucket: string;
    customDomainName: string;
    path: string;
}
