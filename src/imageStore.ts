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

    static readonly ImageKit = new ImageStore(
        "Imagekit",
        "Imagekit"
    );

    static readonly AWS_S3 = new ImageStore(
        "AWS_S3",
        "AWS S3"
    )

    static readonly TENCENTCLOUD_COS = new ImageStore(
        "TENCENTCLOUD_COS",
        "TencentCloud COS"
    )

    static readonly QINIU_KUDO = new ImageStore(
        "QINIU_KUDO",
        "Qiniu KuDo"
    )

    private constructor(readonly id: string, readonly description: string) {
        ImageStore.values.push(this)
    }
}