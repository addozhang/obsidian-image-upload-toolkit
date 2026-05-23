import ImageUploader from "../imageUploader";
import {PutObjectCommand, S3Client} from "@aws-sdk/client-s3";
import {UploaderUtils} from "../uploaderUtils";

export default class AwsS3Uploader implements ImageUploader {
  private readonly s3!: S3Client;
  private readonly bucket!: string;
  private readonly region: string;
  private pathTmpl: string;
  private customDomainName: string;


  constructor(setting: AwsS3Setting) {
    const region = UploaderUtils.trimCredential(setting.region) || (setting.endpoint?.trim() ? "us-east-1" : "");
    const endpoint = setting.endpoint?.trim();
    const s3Config: ConstructorParameters<typeof S3Client>[0] = {
      credentials: {
        accessKeyId: UploaderUtils.trimCredential(setting.accessKeyId),
        secretAccessKey: UploaderUtils.trimCredential(setting.secretAccessKey),
      },
    };
    if (region) {
      s3Config.region = region;
    }
    if (endpoint) {
      s3Config.endpoint = endpoint;
      s3Config.forcePathStyle = true;
    }
    this.s3 = new S3Client(s3Config);
    this.bucket = UploaderUtils.trimCredential(setting.bucketName);
    this.region = region;
    this.pathTmpl = setting.path;
    this.customDomainName = setting.customDomainName;
  }

  async upload(image: File, fullPath: string): Promise<string> {
    const arrayBuffer = await image.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    let path = UploaderUtils.generateName(this.pathTmpl, image.name);
    path = path.replace(/^\/+/, '');
    await this.s3.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: path,
      Body: uint8Array,
    }));
    const location = this.region
      ? `https://${this.bucket}.s3.${this.region}.amazonaws.com/${path}`
      : path;
    return UploaderUtils.customizeDomainName(location, this.customDomainName);
  }
}
export interface AwsS3Setting {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  bucketName: string;
  path: string;
  customDomainName: string;
  endpoint: string;
}
