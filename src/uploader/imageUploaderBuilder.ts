import {PublishSettings} from "../publish";
import ImageUploader from "./imageUploader";
import ImageStore from "../imageStore";

export default function buildUploader(settings: PublishSettings): ImageUploader {
    switch (ImageStore.normalizeId(settings.imageStore)) {
        case ImageStore.IMGUR.id: {
            const {default: ImgurAnonymousUploader} = require("./imgur/imgurAnonymousUploader");
            return new ImgurAnonymousUploader(settings.imgurAnonymousSetting.clientId);
        }
        case ImageStore.GYAZO.id: {
            const {default: GyazoUploader} = require("./gyazo/gyazoUploader");
            return new GyazoUploader(settings.gyazoSetting);
        }
        case ImageStore.ALIYUN_OSS.id: {
            const {default: OssUploader} = require("./oss/ossUploader");
            return new OssUploader(settings.ossSetting);
        }
        case ImageStore.ImageKit.id: {
            const {default: ImagekitUploader} = require("./imagekit/imagekitUploader");
            return new ImagekitUploader(settings.imagekitSetting);
        }
        case ImageStore.AWS_S3.id: {
            const {default: AwsS3Uploader} = require("./s3/awsS3Uploader");
            return new AwsS3Uploader(settings.awsS3Setting);
        }
        case ImageStore.TENCENTCLOUD_COS.id: {
            const {default: CosUploader} = require("./cos/cosUploader");
            return new CosUploader(settings.cosSetting);
        }
        case ImageStore.QINIU_KUDO.id: {
            const {default: KodoUploader} = require("./qiniu/kodoUploader");
            return new KodoUploader(settings.kodoSetting);
        }
        case ImageStore.GITHUB.id: {
            const {default: GitHubUploader} = require("./github/gitHubUploader");
            return new GitHubUploader(settings.githubSetting);
        }
        case ImageStore.CLOUDFLARE_R2.id: {
            const {default: R2Uploader} = require("./r2/r2Uploader");
            return new R2Uploader(settings.r2Setting);
        }
        case ImageStore.BACKBLAZE_B2.id: {
            const {default: B2Uploader} = require("./b2/b2Uploader");
            return new B2Uploader(settings.b2Setting);
        }
        default:
            throw new Error('should not reach here!')
    }
}
