import {afterEach, describe, expect, it, vi} from "vitest";

const s3ClientMock = vi.fn();
const sendMock = vi.fn().mockResolvedValue({});

vi.mock("@aws-sdk/client-s3", () => {
    class S3Client {
        config: any;
        constructor(config: any) {
            // Resolve credentials provider eagerly so the test can introspect them.
            const credsAsync = typeof config.credentials === "function"
                ? config.credentials()
                : Promise.resolve(config.credentials);
            this.config = {
                ...config,
                _resolvedCredentialsPromise: credsAsync,
            };
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

import R2Uploader from "../../src/uploader/r2/r2Uploader";

afterEach(() => {
    s3ClientMock.mockClear();
    sendMock.mockClear();
});

describe("R2Uploader credential sanitization", () => {
    it("trims whitespace from accessKeyId and secretAccessKey", async () => {
        new R2Uploader({
            accessKeyId: "  AKIA-test-key  ",
            secretAccessKey: "secret-key\n",
            endpoint: "https://acct.r2.cloudflarestorage.com",
            bucketName: "blog",
            path: "",
            customDomainName: "",
        });

        expect(s3ClientMock).toHaveBeenCalledTimes(1);
        const config = s3ClientMock.mock.calls[0][0];
        expect(config.credentials.accessKeyId).toBe("AKIA-test-key");
        expect(config.credentials.secretAccessKey).toBe("secret-key");
    });

    it("strips trailing slash from endpoint", () => {
        new R2Uploader({
            accessKeyId: "k",
            secretAccessKey: "s",
            endpoint: "https://acct.r2.cloudflarestorage.com/",
            bucketName: "blog",
            path: "",
            customDomainName: "",
        });

        const config = s3ClientMock.mock.calls[0][0];
        expect(config.endpoint).toBe("https://acct.r2.cloudflarestorage.com");
    });

    it("trims whitespace from bucket name", async () => {
        const uploader = new R2Uploader({
            accessKeyId: "k",
            secretAccessKey: "s",
            endpoint: "https://acct.r2.cloudflarestorage.com",
            bucketName: "  blog\n",
            path: "{filename}",
            customDomainName: "",
        });

        const file = new File([new Uint8Array([1, 2, 3])], "a.png", {type: "image/png"});
        await uploader.upload(file, "a.png");

        expect(sendMock).toHaveBeenCalledTimes(1);
        const command = sendMock.mock.calls[0][0];
        expect(command.input.Bucket).toBe("blog");
        expect(command.input.Key).toBe("a.png");
    });

    it("always uses region 'auto' and forcePathStyle for R2", () => {
        new R2Uploader({
            accessKeyId: "k",
            secretAccessKey: "s",
            endpoint: "https://acct.r2.cloudflarestorage.com",
            bucketName: "blog",
            path: "",
            customDomainName: "",
        });

        const config = s3ClientMock.mock.calls[0][0];
        expect(config.region).toBe("auto");
        expect(config.forcePathStyle).toBe(true);
    });
});
