import ImageUploader from "../imageUploader";
import {UploaderUtils} from "../uploaderUtils";
import * as qiniu from "qiniu";

export default class QiniuUploader implements ImageUploader {
    // private readonly client!: OSS;
    private readonly pathTmpl: String;
    private readonly customDomainName: String;
    private readonly mac: qiniu.auth.digest.Mac;
    private readonly uploadToken: string;
    private readonly config: qiniu.conf.Config;
    private readonly client: qiniu.form_up.FormUploader;

    constructor(setting: QiniuSetting) {
        this.mac = new qiniu.auth.digest.Mac(setting.accessKey, setting.secretKey);
        this.pathTmpl = setting.path;
        this.customDomainName = setting.customDomainName;
        this.uploadToken = new qiniu.rs.PutPolicy({scope: setting.bucket}).uploadToken(this.mac);
        this.config = new qiniu.conf.Config();
        this.client = new qiniu.form_up.FormUploader(this.config);
        // this.client = new OSS({
        //     region: setting.region,
        //     accessKeyId: setting.accessKeyId,
        //     accessKeySecret: setting.accessKeySecret,
        //     bucket: setting.bucket,
        //     secure: true,
        // });
        // this.client.agent = this.client.urllib.agent;
        // this.client.httpsAgent = this.client.urllib.httpsAgent;
        // this.pathTmpl = setting.path;
        // this.customDomainName = setting.customDomainName;
    }

    async upload(image: File, path: string): Promise<string> {
        const putExtra = new qiniu.form_up.PutExtra();
        const filename = UploaderUtils.generateName(this.pathTmpl, image.name);
        const result = this.client.putFile(this.uploadToken, filename, path, putExtra);
        if((await result).resp.statusCode === 200){
            return this.customDomainName + "/" + filename;
        }
        return "";
        // const result = this.client.put(UploaderUtils.generateName(this.pathTmpl, image.name), path);
        // return UploaderUtils.customizeDomainName((await result).url, this.customDomainName);
    }

}

export interface QiniuSetting {
    accessKey: string;
    secretKey: string;
    bucket: string;
    path: string;
    customDomainName: string;
}