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
    this.s3 = new S3Client({
      credentials: {
        accessKeyId: setting.accessKeyId,
        secretAccessKey: setting.secretAccessKey,
      },
      region: setting.region,
    });
    this.bucket = setting.bucketName;
    this.region = setting.region;
    this.pathTmpl = setting.path;
    this.customDomainName = setting.customDomainName;
  }

  async upload(image: File, fullPath: string): Promise<string> {
    const arrayBuffer = await image.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    let path = UploaderUtils.generateName(this.pathTmpl, image.name);
    path = path.replace(/^\/+/, ''); // remove the /
    await this.s3.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: path,
      Body: uint8Array,
    }));
    const location = `https://${this.bucket}.s3.${this.region}.amazonaws.com/${path}`;
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
}
