import ImageUploader from "../imageUploader";
import OSS from "ali-oss"

export default class OssUploader implements ImageUploader {
    private readonly client!: OSS;

    constructor(setting: OssSetting) {
        this.client = new OSS({
            region: setting.region,
            accessKeyId: setting.accessKeyId,
            accessKeySecret: setting.accessKeySecret,
            bucket: setting.bucket,
        });
        this.client.agent = this.client.urllib.agent;
        this.client.httpsAgent = this.client.urllib.httpsAgent;
    }

    async upload(image: File, path: string): Promise<string> {
        const result = this.client.put(image.name, path);
        return (await result).url;
    }
}

export interface OssSetting {
    region: string;
    accessKeyId: string;
    accessKeySecret: string;
    bucket: string;
    endpoint: string;
}