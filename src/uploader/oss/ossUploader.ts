import ImageUploader from "../imageUploader";
import {UploaderUtils} from "../uploaderUtils";
import OSS from "ali-oss"

export default class OssUploader implements ImageUploader {
    private readonly client!: OSS;
    private readonly pathTmpl: String;
    private readonly customDomainName: String;
    private readonly signUrl: boolean;
    private readonly signExpires: number;

    constructor(setting: OssSetting) {
        const signUrl = !!setting.signUrl;
        const signExpiresRaw = Number(setting.signExpires);
        const signExpires = Number.isFinite(signExpiresRaw) && signExpiresRaw > 0 ? Math.floor(signExpiresRaw) : 3600;
        const customDomainName = (setting.customDomainName ?? "").trim();
        const endpoint = (setting.endpoint ?? "").trim().replace(/\/+$/, "");

        const ossOptions: any = {
            region: setting.region,
            accessKeyId: setting.accessKeyId,
            accessKeySecret: setting.accessKeySecret,
            bucket: setting.bucket,
            secure: true,
        };

        if (signUrl) {
            if (customDomainName) {
                ossOptions.endpoint = customDomainName.replace(/^https?:\/\//, "").replace(/\/+$/, "");
                ossOptions.cname = true;
            } else if (endpoint) {
                ossOptions.endpoint = endpoint;
            }
        }

        this.client = new OSS(ossOptions);
        this.client.agent = this.client.urllib.agent;
        this.client.httpsAgent = this.client.urllib.httpsAgent;
        this.pathTmpl = setting.path;
        this.customDomainName = customDomainName;
        this.signUrl = signUrl;
        this.signExpires = signExpires;
    }

    async upload(image: File, path: string): Promise<string> {
        // Use the File object's buffer instead of reading from filesystem
        // This allows uploading web images and local images uniformly
        const buffer = await image.arrayBuffer();
        let objectKey = UploaderUtils.generateName(this.pathTmpl, image.name);
        objectKey = objectKey.replace(/^\/+/, "");
        const result = await this.client.put(objectKey, Buffer.from(buffer));

        if (this.signUrl) {
            return this.client.signatureUrl(objectKey, {expires: this.signExpires});
        }

        return UploaderUtils.customizeDomainName(result.url, this.customDomainName);
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
    signUrl?: boolean;
    signExpires?: number;
}
