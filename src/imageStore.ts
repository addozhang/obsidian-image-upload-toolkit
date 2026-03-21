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
    
    static readonly GITHUB = new ImageStore(
        "GITHUB",
        "GitHub Repository"
    )

    static readonly GYAZO = new ImageStore(
        "GYAZO",
        "Gyazo"
    )
    
    static readonly CLOUDFLARE_R2 = new ImageStore(
        "CLOUDFLARE_R2",
        "Cloudflare R2"
    )
    
    static readonly BACKBLAZE_B2 = new ImageStore(
        "BACKBLAZE_B2",
        "Backblaze B2"
    )

    private static readonly aliases: Record<string, string> = {
        imgur: ImageStore.IMGUR.id,
        gyazo: ImageStore.GYAZO.id,
        oss: ImageStore.ALIYUN_OSS.id,
        aliyun_oss: ImageStore.ALIYUN_OSS.id,
        imagekit: ImageStore.ImageKit.id,
        s3: ImageStore.AWS_S3.id,
        aws_s3: ImageStore.AWS_S3.id,
        cos: ImageStore.TENCENTCLOUD_COS.id,
        tencentcloud_cos: ImageStore.TENCENTCLOUD_COS.id,
        qiniu: ImageStore.QINIU_KUDO.id,
        qiniu_kudo: ImageStore.QINIU_KUDO.id,
        github: ImageStore.GITHUB.id,
        r2: ImageStore.CLOUDFLARE_R2.id,
        cloudflare_r2: ImageStore.CLOUDFLARE_R2.id,
        b2: ImageStore.BACKBLAZE_B2.id,
        backblaze_b2: ImageStore.BACKBLAZE_B2.id,
    };

    private constructor(readonly id: string, readonly description: string) {
        ImageStore.values.push(this)
    }

    static normalizeId(id: string | undefined | null): string {
        if (!id) {
            return ImageStore.IMGUR.id;
        }

        if (ImageStore.values.some((store) => store.id === id)) {
            return id;
        }

        return ImageStore.aliases[id.toLowerCase()] || id;
    }
}
