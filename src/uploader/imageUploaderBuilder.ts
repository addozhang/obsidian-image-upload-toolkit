import {PublishSettings} from "../publish";
import ImageUploader from "./imageUploader";
import ImageStore from "../imageStore";
import ImgurAnonymousUploader from "./imgur/imgurAnonymousUploader";

export default function buildUploader(settings: PublishSettings): ImageUploader {
    switch (settings.imageStore) {
        case ImageStore.ANONYMOUS_IMGUR.id:
            return new ImgurAnonymousUploader(settings.imgurAnonymousSetting.clientId);
        //todo more cases
        default:
            throw new Error('should not reach here!')
    }
    return undefined;
}