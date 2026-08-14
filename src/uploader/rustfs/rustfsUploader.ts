import ImageUploader from "../imageUploader";
import {PutObjectCommand, S3Client} from "@aws-sdk/client-s3";
import {UploaderUtils} from "../uploaderUtils";

export default class RustfsUploader implements ImageUploader {
    private readonly s3!: S3Client;
    private readonly bucket!: string;
    private pathTmpl: string;
    private endpoint: string;

    constructor(setting: RustfsSetting) {
        const endpoint = UploaderUtils.normalizeEndpoint(setting.endpoint);
        this.s3 = new S3Client({
            credentials: {
                accessKeyId: UploaderUtils.trimCredential(setting.accessKeyId),
                secretAccessKey: UploaderUtils.trimCredential(setting.secretAccessKey),
            },
            endpoint,
            region: 'us-east-1', // RustFS doesn't require a real region
            forcePathStyle: true, // RustFS uses path-style addressing
        });
        this.bucket = UploaderUtils.trimCredential(setting.bucketName);
        this.pathTmpl = setting.path;
        this.endpoint = endpoint;
    }

    async upload(image: File, fullPath: string): Promise<string> {
        const arrayBuffer = await image.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        let path = UploaderUtils.generateName(this.pathTmpl, image.name);
        path = path.replace(/^\/+/, ''); // remove leading /
        await this.s3.send(new PutObjectCommand({
            Bucket: this.bucket,
            Key: path,
            Body: uint8Array,
            ContentType: `image/${image.name.split('.').pop()}`,
        }));
        // RustFS: construct URL from endpoint + bucket + key
        return `${this.endpoint}/${this.bucket}/${path}`;
    }
}

export interface RustfsSetting {
    accessKeyId: string;
    secretAccessKey: string;
    endpoint: string;
    bucketName: string;
    path: string;
}
