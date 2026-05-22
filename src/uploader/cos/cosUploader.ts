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

const SIGN_LIFETIME_SECONDS = 600;

export default class CosUploader implements ImageUploader {

    private readonly pathTmpl: string;
    private readonly customDomainName: string;
    private readonly region: string;
    private readonly bucket: string;
    private readonly secretId: string;
    private readonly secretKey: string;

    constructor(setting: CosSetting) {
        this.pathTmpl = setting.path;
        this.customDomainName = setting.customDomainName;
        this.bucket = setting.bucket;
        this.region = setting.region;
        this.secretId = setting.secretId;
        this.secretKey = setting.secretKey;
    }

    async upload(image: File, fullPath: string): Promise<string> {
        const key = UploaderUtils.generateName(this.pathTmpl, image.name).replace(/^\/+/, "");
        const body = await image.arrayBuffer();
        const contentType = this.resolveContentType(image);
        const host = `${this.bucket}.cos.${this.region}.myqcloud.com`;
        const url = `https://${host}/${encodePathKey(key)}`;
        const authorization = this.buildAuthorization("put", `/${key}`, host);

        const response = await requestUrl({
            url,
            method: "PUT",
            headers: {
                // NOTE: do not set `Host` here. Electron/Chromium forbids
                // explicitly setting the Host header (`net::ERR_INVALID_ARGUMENT`).
                // The browser sets it automatically from the URL and COS
                // validates it against the signature.
                Authorization: authorization,
                "Content-Type": contentType,
            },
            body,
            throw: false,
        });

        if (response.status < 200 || response.status >= 300) {
            throw new Error(`Tencent COS upload failed (${response.status}): ${response.text || "no response body"}`);
        }

        return UploaderUtils.customizeDomainName(url, this.customDomainName);
    }

    /**
     * Builds the Tencent COS XML-API authorization header per
     * https://www.tencentcloud.com/document/product/436/7778
     */
    private buildAuthorization(method: string, pathname: string, host: string): string {
        const now = Math.floor(Date.now() / 1000);
        const keyTime = `${now};${now + SIGN_LIFETIME_SECONDS}`;
        const signKey = createHmac("sha1", this.secretKey).update(keyTime).digest("hex");

        // Only the Host header is signed; no query parameters.
        const headerList = "host";
        const headersString = `host=${encodeURIComponent(host).toLowerCase()}`;

        const httpString = `${method.toLowerCase()}\n${pathname}\n\n${headersString}\n`;
        const httpStringSha1 = createHash("sha1").update(httpString).digest("hex");
        const stringToSign = `sha1\n${keyTime}\n${httpStringSha1}\n`;
        const signature = createHmac("sha1", signKey).update(stringToSign).digest("hex");

        return [
            "q-sign-algorithm=sha1",
            `q-ak=${this.secretId}`,
            `q-sign-time=${keyTime}`,
            `q-key-time=${keyTime}`,
            `q-header-list=${headerList}`,
            "q-url-param-list=",
            `q-signature=${signature}`,
        ].join("&");
    }

    private resolveContentType(image: File): string {
        if (image.type) {
            return image.type;
        }
        const ext = image.name.split(".").pop()?.toLowerCase() ?? "";
        return EXTENSION_MIME_MAP[ext] || "application/octet-stream";
    }
}

/**
 * Encode an object key for inclusion in a COS URL. Slashes are preserved as
 * path separators; every other segment is percent-encoded.
 */
function encodePathKey(key: string): string {
    return key.split("/").map(encodeURIComponent).join("/");
}

export interface CosSetting {
    region: string;
    bucket: string;
    secretId: string;
    secretKey: string;
    path: string;
    customDomainName: string;
}
