import ImageUploader from "../imageUploader";
import AWS from 'aws-sdk';
import {UploaderUtils} from "../uploaderUtils";

const EXTENSION_MIME_MAP: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  svg: "image/svg+xml",
  webp: "image/webp",
};

export default class B2Uploader implements ImageUploader {
  private readonly s3!: AWS.S3;
  private readonly bucket!: string;
  private pathTmpl: string;
  private customDomainName: string;

  constructor(setting: B2Setting) {
    this.s3 = new AWS.S3({
      accessKeyId: setting.accessKeyId,
      secretAccessKey: setting.secretAccessKey,
      endpoint: `https://s3.${setting.region}.backblazeb2.com`,
      region: setting.region,
      s3ForcePathStyle: true,
      signatureVersion: 'v4',
    });
    this.bucket = setting.bucketName;
    this.pathTmpl = setting.path;
    this.customDomainName = setting.customDomainName;
  }

  async upload(image: File, fullPath: string): Promise<string> {
    const arrayBuffer = await this.readFileAsArrayBuffer(image);
    const uint8Array = new Uint8Array(arrayBuffer);
    var path = UploaderUtils.generateName(this.pathTmpl, image.name);
    path = path.replace(/^\/+/, ''); // remove the /
    const ext = image.name.split('.').pop()?.toLowerCase() ?? '';
    const contentType = image.type || EXTENSION_MIME_MAP[ext] || `image/${ext}`;
    const params = {
      Bucket: this.bucket,
      Key: path,
      Body: uint8Array,
      ContentType: contentType,
    };
    return new Promise((resolve, reject) => {
      this.s3.upload(params, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(UploaderUtils.customizeDomainName(data.Key, this.customDomainName));
        }
      });
    });
  }

  private readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }
}

export interface B2Setting {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  bucketName: string;
  path: string;
  customDomainName: string;
}
