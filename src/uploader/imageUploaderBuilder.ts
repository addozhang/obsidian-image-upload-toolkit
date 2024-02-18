import {PublishSettings} from "../publish";
import ImageUploader from "./imageUploader";
import ImageStore from "../imageStore";
import ImgurAnonymousUploader from "./imgur/imgurAnonymousUploader";
import OssUploader from "./oss/ossUploader";
import ImagekitUploader from "./imagekit/imagekitUploader";

export default function buildUploader(settings: PublishSettings): ImageUploader {
    switch (settings.imageStore) {
        case ImageStore.IMGUR.id:
            return new ImgurAnonymousUploader(settings.imgurAnonymousSetting.clientId);
        case ImageStore.ALIYUN_OSS.id:
            return new OssUploader(settings.ossSetting);
        case ImageStore.ImageKit.id:
            return new ImagekitUploader(settings.imagekitSetting);
        //todo more cases
        default:
            throw new Error('should not reach here!')
    }
}