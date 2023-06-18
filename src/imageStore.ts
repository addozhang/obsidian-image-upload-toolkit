export default class ImageStore {
    private static readonly values: ImageStore[] = [];

    static get lists(): ReadonlyArray<ImageStore> {
        return this.values;
    }

    static readonly IMGUR = new ImageStore(
        "IMGUR",
        "Imgur upload"
    )

    static readonly ALIYUN_OSS = new ImageStore(
        "ALIYUN_OSS",
        "AliYun OSS"
    )

    private constructor(readonly id: string, readonly description: string) {
        ImageStore.values.push(this)
    }
}