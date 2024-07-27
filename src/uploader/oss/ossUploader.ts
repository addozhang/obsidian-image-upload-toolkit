import ImageUploader from "../imageUploader";
import {UploaderUtils} from "../uploaderUtils";
import OSS from "ali-oss"

export default class OssUploader implements ImageUploader {
    private readonly client!: OSS;
    private readonly pathTmpl: String;
    private readonly customDomainName: String;

    constructor(setting: OssSetting) {
        this.client = new OSS({
            region: setting.region,
            accessKeyId: setting.accessKeyId,
            accessKeySecret: setting.accessKeySecret,
            bucket: setting.bucket,
            secure: true,
        });
        this.client.agent = this.client.urllib.agent;
        this.client.httpsAgent = this.client.urllib.httpsAgent;
        this.pathTmpl = setting.path;
        this.customDomainName = setting.customDomainName;
    }

    async upload(image: File, path: string): Promise<string> {
        const result = this.client.put(UploaderUtils.generateName(this.pathTmpl, image.name), path);
        return UploaderUtils.customizeDomainName((await result).url, this.customDomainName);
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