import {afterEach, describe, expect, it, vi} from "vitest";

const s3ClientMock = vi.fn();
const sendMock = vi.fn().mockResolvedValue({});

vi.mock("@aws-sdk/client-s3", () => {
    class S3Client {
        config: any;
        constructor(config: any) {
            this.config = config;
            s3ClientMock(config);
        }
        send = sendMock;
    }
    class PutObjectCommand {
        input: any;
        constructor(input: any) { this.input = input; }
    }
    return {S3Client, PutObjectCommand};
});

import AwsS3Uploader, {AwsS3Setting} from "../../src/uploader/s3/awsS3Uploader";
import B2Uploader, {B2Setting} from "../../src/uploader/b2/b2Uploader";

afterEach(() => {
    s3ClientMock.mockClear();
    sendMock.mockClear();
});

describe("AwsS3Uploader", () => {
    function setting(overrides: Partial<AwsS3Setting> = {}): AwsS3Setting {
        return {
            accessKeyId: "k",
            secretAccessKey: "s",
            region: "us-east-1",
            bucketName: "blog",
            path: "",
            customDomainName: "",
            ...overrides,
        };
    }

    it("uploads to the templated key and returns the virtual-hosted url", async () => {
        const uploader = new AwsS3Uploader(setting({path: "{year}/{filename}"}));
        const url = await uploader.upload(new File(["x"], "a.png", {type: "image/png"}), "a.png");

        expect(sendMock.mock.calls[0][0].input.Key).toMatch(/^\d{4}\/a\.png$/);
        expect(sendMock.mock.calls[0][0].input.Bucket).toBe("blog");
        expect(url).toMatch(/^https:\/\/blog\.s3\.us-east-1\.amazonaws\.com\/\d{4}\/a\.png$/);
    });

    it("swaps in the custom domain when configured", async () => {
        const uploader = new AwsS3Uploader(setting({customDomainName: "cdn.example.com"}));
        const url = await uploader.upload(new File(["x"], "a.png"), "a.png");

        expect(url).toBe("https://cdn.example.com/a.png");
    });

    it("trims whitespace from credentials and bucket", async () => {
        const uploader = new AwsS3Uploader(setting({accessKeyId: " k ", secretAccessKey: "s\n", bucketName: " blog "}));
        await uploader.upload(new File(["x"], "a.png"), "a.png");

        expect(s3ClientMock.mock.calls[0][0].credentials.accessKeyId).toBe("k");
        expect(s3ClientMock.mock.calls[0][0].credentials.secretAccessKey).toBe("s");
        expect(sendMock.mock.calls[0][0].input.Bucket).toBe("blog");
    });
});

describe("B2Uploader", () => {
    function setting(overrides: Partial<B2Setting> = {}): B2Setting {
        return {
            accessKeyId: "k",
            secretAccessKey: "s",
            region: "us-west-004",
            bucketName: "blog",
            path: "",
            customDomainName: "",
            ...overrides,
        };
    }

    it("targets the region endpoint with path style", () => {
        new B2Uploader(setting());

        expect(s3ClientMock.mock.calls[0][0].endpoint).toBe("https://s3.us-west-004.backblazeb2.com");
        expect(s3ClientMock.mock.calls[0][0].forcePathStyle).toBe(true);
    });

    it("sends the templated key with a resolved content type", async () => {
        const uploader = new B2Uploader(setting({path: "{filename}"}));
        const url = await uploader.upload(new File(["x"], "a.png", {type: "image/png"}), "a.png");

        const input = sendMock.mock.calls[0][0].input;
        expect(input.Key).toBe("a.png");
        expect(input.Bucket).toBe("blog");
        expect(input.ContentType).toBe("image/png");
        expect(url).toBe("https://blog.s3.us-west-004.backblazeb2.com/a.png");
    });

    it("falls back to extension-derived content type when file type is empty", async () => {
        const uploader = new B2Uploader(setting());
        await uploader.upload(new File(["x"], "a.webp"), "a.webp");

        expect(sendMock.mock.calls[0][0].input.ContentType).toBe("image/webp");
    });

    it("swaps in the custom domain when configured", async () => {
        const uploader = new B2Uploader(setting({customDomainName: "cdn.example.com"}));
        const url = await uploader.upload(new File(["x"], "a.png"), "a.png");

        expect(url).toBe("https://cdn.example.com/a.png");
    });
});
