import {PublishSettings} from "../publish";
import ImageUploader from "./imageUploader";
import ImageStore from "../imageStore";
import ImgurAnonymousUploader from "./imgur/imgurAnonymousUploader";
import OssUploader from "./oss/ossUploader";
import ImagekitUploader from "./imagekit/imagekitUploader";
import AwsS3Uploader from "./s3/awsS3Uploader";
import CosUploader from "./cos/cosUploader";
import QiniuUploader from "./qiniu/qiniuUploader";

export default function buildUploader(settings: PublishSettings): ImageUploader {
    switch (settings.imageStore) {
        case ImageStore.IMGUR.id:
            return new ImgurAnonymousUploader(settings.imgurAnonymousSetting.clientId);
        case ImageStore.ALIYUN_OSS.id:
            return new OssUploader(settings.ossSetting);
        case ImageStore.ImageKit.id:
            return new ImagekitUploader(settings.imagekitSetting);
        case ImageStore.AWS_S3.id:
            return new AwsS3Uploader(settings.awsS3Setting);
        case ImageStore.TENCENTCLOUD_COS.id:
            return new CosUploader(settings.cosSetting);
        case ImageStore.QINIU_OSS.id:
            return new QiniuUploader(settings.qiniuSetting);
        //todo more cases
        default:
            throw new Error('should not reach here!')
    }
}