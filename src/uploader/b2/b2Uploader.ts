import ImageUploader from "../imageUploader";
import {PutObjectCommand, S3Client} from "@aws-sdk/client-s3";
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
  private readonly s3!: S3Client;
  private readonly bucket!: string;
  private pathTmpl: string;
  private customDomainName: string;

  constructor(setting: B2Setting) {
    this.s3 = new S3Client({
      credentials: {
        accessKeyId: setting.accessKeyId,
        secretAccessKey: setting.secretAccessKey,
      },
      endpoint: `https://s3.${setting.region}.backblazeb2.com`,
      region: setting.region,
      forcePathStyle: true,
    });
    this.bucket = setting.bucketName;
    this.pathTmpl = setting.path;
    this.customDomainName = setting.customDomainName;
  }

  async upload(image: File, fullPath: string): Promise<string> {
    const arrayBuffer = await image.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    let path = UploaderUtils.generateName(this.pathTmpl, image.name);
    path = path.replace(/^\/+/, ''); // remove the /
    const ext = image.name.split('.').pop()?.toLowerCase() ?? '';
    const contentType = image.type || EXTENSION_MIME_MAP[ext] || `image/${ext}`;
    await this.s3.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: path,
      Body: uint8Array,
      ContentType: contentType,
    }));
    return UploaderUtils.customizeDomainName(path, this.customDomainName);
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
