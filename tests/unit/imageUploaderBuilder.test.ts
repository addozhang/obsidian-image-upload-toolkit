import {describe, expect, it} from "vitest";
import buildUploader from "../../src/uploader/imageUploaderBuilder";
import ImageStore from "../../src/imageStore";
import ImgurAnonymousUploader from "../../src/uploader/imgur/imgurAnonymousUploader";
import GyazoUploader from "../../src/uploader/gyazo/gyazoUploader";
import OssUploader from "../../src/uploader/oss/ossUploader";
import ImagekitUploader from "../../src/uploader/imagekit/imagekitUploader";
import AwsS3Uploader from "../../src/uploader/s3/awsS3Uploader";
import CosUploader from "../../src/uploader/cos/cosUploader";
import KodoUploader from "../../src/uploader/qiniu/kodoUploader";
import GitHubUploader from "../../src/uploader/github/gitHubUploader";
import R2Uploader from "../../src/uploader/r2/r2Uploader";
import B2Uploader from "../../src/uploader/b2/b2Uploader";

function settings(imageStore: string): any {
    return {
        imageStore,
        imgurAnonymousSetting: {clientId: "cid"},
        gyazoSetting: {accessToken: "t", accessPolicy: "anyone", desc: ""},
        ossSetting: {},
        imagekitSetting: {},
        awsS3Setting: {region: "us-east-1"},
        cosSetting: {},
        kodoSetting: {},
        githubSetting: {repositoryName: "owner/repo", branchName: "main", token: "t", path: ""},
        r2Setting: {},
        b2Setting: {region: "us-west-004"},
    };
}

describe("imageUploaderBuilder", () => {
    const cases: Array<[string, string, unknown]> = [
        [ImageStore.IMGUR.id, ImgurAnonymousUploader.name, ImgurAnonymousUploader],
        [ImageStore.GYAZO.id, GyazoUploader.name, GyazoUploader],
        [ImageStore.ALIYUN_OSS.id, OssUploader.name, OssUploader],
        [ImageStore.ImageKit.id, ImagekitUploader.name, ImagekitUploader],
        [ImageStore.AWS_S3.id, AwsS3Uploader.name, AwsS3Uploader],
        [ImageStore.TENCENTCLOUD_COS.id, CosUploader.name, CosUploader],
        [ImageStore.QINIU_KUDO.id, KodoUploader.name, KodoUploader],
        [ImageStore.GITHUB.id, GitHubUploader.name, GitHubUploader],
        [ImageStore.CLOUDFLARE_R2.id, R2Uploader.name, R2Uploader],
        [ImageStore.BACKBLAZE_B2.id, B2Uploader.name, B2Uploader],
    ];

    it.each(cases)("builds %s as %s", (id, _name, clazz) => {
        expect(buildUploader(settings(id))).toBeInstanceOf(clazz as any);
    });

    it("resolves legacy aliases through normalizeId", () => {
        expect(buildUploader(settings("s3"))).toBeInstanceOf(AwsS3Uploader);
        expect(buildUploader(settings("oss"))).toBeInstanceOf(OssUploader);
        expect(buildUploader(settings("b2"))).toBeInstanceOf(B2Uploader);
    });

    it("throws for an unknown store id", () => {
        expect(() => buildUploader(settings("NOT_A_STORE"))).toThrow();
    });
});
