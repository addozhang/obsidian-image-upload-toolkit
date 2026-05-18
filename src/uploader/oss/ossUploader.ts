import {requestUrl} from "obsidian";
import {createHash, createHmac} from "crypto";
import ImageUploader from "../imageUploader";
import {UploaderUtils} from "../uploaderUtils";

const EXTENSION_MIME_MAP: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    svg: "image/svg+xml",
    webp: "image/webp",
    bmp: "image/bmp",
};

export default class OssUploader implements ImageUploader {
    private readonly pathTmpl: string;
    private readonly customDomainName: string;
    private readonly region: string;
    private readonly bucket: string;
    private readonly accessKeyId: string;
    private readonly accessKeySecret: string;

    constructor(setting: OssSetting) {
        this.region = setting.region;
        this.bucket = setting.bucket;
        this.accessKeyId = setting.accessKeyId;
        this.accessKeySecret = setting.accessKeySecret;
        this.pathTmpl = setting.path;
        this.customDomainName = setting.customDomainName;
    }

    async upload(image: File, fullPath: string): Promise<string> {
        const key = UploaderUtils.generateName(this.pathTmpl, image.name).replace(/^\/+/, "");
        const body = await image.arrayBuffer();
        const contentType = this.resolveContentType(image);
        const contentMd5 = createHash("md5").update(Buffer.from(body)).digest("base64");
        const date = new Date().toUTCString();

        const stringToSign = [
            "PUT",
            contentMd5,
            contentType,
            date,
            `/${this.bucket}/${key}`,
        ].join("\n");
        const signature = createHmac("sha1", this.accessKeySecret).update(stringToSign).digest("base64");

        const url = `https://${this.bucket}.${this.region}.aliyuncs.com/${encodeURI(key)}`;
        const response = await requestUrl({
            url,
            method: "PUT",
            headers: {
                Authorization: `OSS ${this.accessKeyId}:${signature}`,
                "Content-Type": contentType,
                "Content-MD5": contentMd5,
                Date: date,
            },
            body,
            throw: false,
        });

        if (response.status < 200 || response.status >= 300) {
            throw new Error(`Aliyun OSS upload failed (${response.status}): ${response.text || "no response body"}`);
        }

        return UploaderUtils.customizeDomainName(url, this.customDomainName);
    }

    private resolveContentType(image: File): string {
        if (image.type) {
            return image.type;
        }
        const ext = image.name.split(".").pop()?.toLowerCase() ?? "";
        return EXTENSION_MIME_MAP[ext] || "application/octet-stream";
    }
}

export interface OssSetting {
    region: string;
    accessKeyId: string;
    accessKeySecret: string;
    bucket: string;
    endpoint: string;
    path: string;
    customDomainName: string;
}
