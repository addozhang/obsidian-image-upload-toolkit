import ImageUploader from "../imageUploader";
import OSS from "ali-oss"

export default class OssUploader implements ImageUploader {
    private readonly client!: OSS;
    private readonly pathTmpl: String;

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
    }

    async upload(image: File, path: string): Promise<string> {
        const result = this.client.put(this.generateName(image.name), path);
        return (await result).url;
    }

    private generateName(imageName: string): string {
        const date = new Date();
        const year = date.getFullYear().toString();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const random = this.generateRandomString(20);

        return this.pathTmpl != undefined && this.pathTmpl.length > 0 ? this.pathTmpl
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

}

export interface OssSetting {
    region: string;
    accessKeyId: string;
    accessKeySecret: string;
    bucket: string;
    endpoint: string;
    path: string;
}