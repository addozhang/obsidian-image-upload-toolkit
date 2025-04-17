import {PublishSettings} from "../publish";
import ImageUploader from "./imageUploader";
import ImageStore from "../imageStore";
import ImgurAnonymousUploader from "./imgur/imgurAnonymousUploader";
import OssUploader from "./oss/ossUploader";
import ImagekitUploader from "./imagekit/imagekitUploader";
import AwsS3Uploader from "./s3/awsS3Uploader";
import CosUploader from "./cos/cosUploader";
import KodoUploader from "./qiniu/kodoUploader";
import GitHubUploader from "./github/gitHubUploader";
import R2Uploader from "./r2/r2Uploader";

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
        case ImageStore.QINIU_KUDO.id:
            return new KodoUploader(settings.kodoSetting);
        case ImageStore.GITHUB.id:
            return new GitHubUploader(settings.githubSetting);
        case ImageStore.CLOUDFLARE_R2.id:
            return new R2Uploader(settings.r2Setting);
        //todo more cases
        default:
            throw new Error('should not reach here!')
    }
}