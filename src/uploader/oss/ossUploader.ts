import ImageUploader from "../imageUploader";
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
        const result = this.client.put(this.generateName(image.name), path);
        return this.customizeDomainName((await result).url);
    }

    private generateName(imageName: string): string {
        const date = new Date();
        const year = date.getFullYear().toString();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const random = this.generateRandomString(20);

        return this.pathTmpl != undefined && this.pathTmpl.trim().length > 0 ? this.pathTmpl
                .replace('{year}', year)
                .replace('{mon}', month)
                .replace('{day}', day)
                .replace('{random}', random)
                .replace('{filename}', imageName)
            : imageName
            ;
    }

    private generateRandomString(length: number): string {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';

        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * characters.length);
            result += characters.charAt(randomIndex);
        }

        return result;
    }

    private customizeDomainName(url) {
        const regex = /https?:\/\/([^/]+)/;
        if (this.customDomainName && this.customDomainName.trim() !== "") {
            return url.replace(regex, (match, domain) => {
                return match.replace(domain, this.customDomainName);
            })
        }
        return url;
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