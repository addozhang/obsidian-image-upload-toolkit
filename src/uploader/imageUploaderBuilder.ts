import {PublishSettings} from "../publish";
import ImageStore from "../imageStore";
import {requireProvider} from "../providers/registry";
import ImageUploader from "./imageUploader";

export default function buildUploader(settings: PublishSettings): ImageUploader {
    return requireProvider(ImageStore.normalizeId(settings.imageStore)).build(settings);
}
