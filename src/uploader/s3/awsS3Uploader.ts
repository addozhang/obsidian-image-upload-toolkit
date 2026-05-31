import ImageUploader from "../imageUploader";
import {PutObjectCommand, S3Client} from "@aws-sdk/client-s3";
import {UploaderUtils} from "../uploaderUtils";

export default class AwsS3Uploader implements ImageUploader {
  private readonly s3!: S3Client;
  private readonly bucket!: string;
  private readonly region: string;
  private readonly endpoint: string;
  private pathTmpl: string;
  private customDomainName: string;


  constructor(setting: AwsS3Setting) {
    const endpoint = UploaderUtils.normalizeEndpoint(setting.endpoint);
    const region = UploaderUtils.trimCredential(setting.region) || (endpoint ? "us-east-1" : "");
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
    this.endpoint = endpoint;
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
    let location: string;
    if (this.customDomainName) {
      location = `https://${this.bucket}.s3.amazonaws.com/${path}`;
    } else if (this.endpoint) {
      location = `${this.endpoint}/${this.bucket}/${path}`;
    } else {
      location = `https://${this.bucket}.s3.${this.region}.amazonaws.com/${path}`;
    }
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
