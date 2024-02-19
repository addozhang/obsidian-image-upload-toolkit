import ImageUploader from "../imageUploader";
import Imagekit from "imagekit";

export default class ImagekitUploader implements ImageUploader {
    private readonly imagekit!: Imagekit;
    private readonly setting!: ImagekitSetting;

    constructor(setting: ImagekitSetting) {
        this.imagekit = new Imagekit({
            publicKey: setting.publicKey,
            privateKey: setting.privateKey,
            urlEndpoint: setting.endpoint,
        });
        this.setting = setting;
    }
    async upload(image: File, fullPath: string): Promise<string> {
        const result = await this.imagekit.upload({
            file : Buffer.from((await image.arrayBuffer())).toString('base64'),   //required
            fileName : image.name,   //required
            folder: this.setting.folder || '/',
            extensions: [
                {
                    name: "google-auto-tagging",
                    maxTags: 5,
                    minConfidence: 95
                }
            ]
        });

        return result.url;
    }
}


export interface ImagekitSetting {
    folder: string;
    imagekitID: string;
    publicKey: string;
    privateKey: string;
    endpoint: string;
}