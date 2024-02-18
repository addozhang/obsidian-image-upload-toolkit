import ImageUploader from "../imageUploader";
import Imagekit from "imagekit";

export default class ImagekitUploader implements ImageUploader {
    private readonly imagekit!: Imagekit;

    constructor(setting: ImagekitSetting) {
        this.imagekit = new Imagekit({
            publicKey : setting.publicKey,
            privateKey : setting.privateKey,
            urlEndpoint: setting.endpoint,
        })
    }
    async upload(image: File, fullPath: string): Promise<string> {
        const result = await this.imagekit.upload({
            file : Buffer.from((await image.arrayBuffer())).toString('base64'),   //required
            fileName : image.name,   //required
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
    imagekitID: string;
    publicKey: string;
    privateKey: string;
    endpoint: string;
}