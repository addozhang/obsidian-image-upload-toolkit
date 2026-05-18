import ImageUploader from "../imageUploader";
import {PutObjectCommand, S3Client} from "@aws-sdk/client-s3";
import {UploaderUtils} from "../uploaderUtils";

export default class R2Uploader implements ImageUploader {
  private readonly r2!: S3Client;
  private readonly bucket!: string;
  private pathTmpl: string;
  private customDomainName: string;

  constructor(setting: R2Setting) {
    this.r2 = new S3Client({
      credentials: {
        accessKeyId: setting.accessKeyId,
        secretAccessKey: setting.secretAccessKey,
      },
      endpoint: setting.endpoint,
      region: 'auto', // Cloudflare R2 uses 'auto' region
      forcePathStyle: true, // Needed for Cloudflare R2
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
    await this.r2.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: path,
      Body: uint8Array,
      ContentType: `image/${image.name.split('.').pop()}`,
    }));
    return UploaderUtils.customizeDomainName(path, this.customDomainName);
  }
}

export interface R2Setting {
  accessKeyId: string;
  secretAccessKey: string;
  endpoint: string;
  bucketName: string;
  path: string;
  customDomainName: string;
}
