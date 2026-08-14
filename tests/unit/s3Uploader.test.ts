import {beforeEach, describe, expect, it, vi} from "vitest";
import {AwsS3Setting, default as AwsS3Uploader} from "../../src/uploader/s3/awsS3Uploader";

const { mockS3Client } = vi.hoisted(() => {
  let lastCallArgs: any = null;
  let lastSendMock: any = null;
  const MockClass = function(args: any) {
    lastCallArgs = args;
    lastSendMock = vi.fn();
    return { send: lastSendMock };
  };
  (MockClass as any).getLastCallArgs = () => lastCallArgs;
  (MockClass as any).resetLastCallArgs = () => { lastCallArgs = null; lastSendMock = null; };
  (MockClass as any).getLastSendMock = () => lastSendMock;
  return { mockS3Client: MockClass };
});

vi.mock('@aws-sdk/client-s3', () => {
  return {
    S3Client: mockS3Client,
    PutObjectCommand: class PutObjectCommand {
      constructor(input: any) { this.input = input; }
      input: any;
    }
  };
});

describe("AwsS3Uploader constructor", () => {
  beforeEach(() => {
    mockS3Client.resetLastCallArgs();
  });

  it("should trim endpoint and set forcePathStyle when endpoint is provided", () => {
    const setting: AwsS3Setting = {
      accessKeyId: "test-key",
      secretAccessKey: "test-secret",
      region: "us-west-2",
      bucketName: "test-bucket",
      path: "/images/{filename}",
      customDomainName: "",
      endpoint: "  https://custom-s3.example.com  ",
    };

    new AwsS3Uploader(setting);

    const callArgs = mockS3Client.getLastCallArgs();
    expect(callArgs.endpoint).toBe("https://custom-s3.example.com");
    expect(callArgs.forcePathStyle).toBe(true);
  });

  it("should strip trailing slash from endpoint", () => {
    const setting: AwsS3Setting = {
      accessKeyId: "test-key",
      secretAccessKey: "test-secret",
      region: "us-west-2",
      bucketName: "test-bucket",
      path: "{filename}",
      customDomainName: "",
      endpoint: "https://minio.example.com/",
    };

    new AwsS3Uploader(setting);

    const callArgs = mockS3Client.getLastCallArgs();
    expect(callArgs.endpoint).toBe("https://minio.example.com");
  });

  it("should not set endpoint when endpoint is empty string", () => {
    const setting: AwsS3Setting = {
      accessKeyId: "test-key",
      secretAccessKey: "test-secret",
      region: "us-west-2",
      bucketName: "test-bucket",
      path: "/images/{filename}",
      customDomainName: "",
      endpoint: "",
    };

    new AwsS3Uploader(setting);

    const callArgs = mockS3Client.getLastCallArgs();
    expect(callArgs.endpoint).toBeUndefined();
    expect(callArgs.forcePathStyle).toBeUndefined();
  });

  it("should not set endpoint when endpoint is whitespace-only", () => {
    const setting: AwsS3Setting = {
      accessKeyId: "test-key",
      secretAccessKey: "test-secret",
      region: "us-west-2",
      bucketName: "test-bucket",
      path: "/images/{filename}",
      customDomainName: "",
      endpoint: "   ",
    };

    new AwsS3Uploader(setting);

    const callArgs = mockS3Client.getLastCallArgs();
    expect(callArgs.endpoint).toBeUndefined();
    expect(callArgs.forcePathStyle).toBeUndefined();
  });

  it("should not set region when region is empty string", () => {
    const setting: AwsS3Setting = {
      accessKeyId: "test-key",
      secretAccessKey: "test-secret",
      region: "",
      bucketName: "test-bucket",
      path: "/images/{filename}",
      customDomainName: "",
      endpoint: "",
    };

    new AwsS3Uploader(setting);

    const callArgs = mockS3Client.getLastCallArgs();
    expect(callArgs.region).toBeUndefined();
  });

  it("should default to us-east-1 when custom endpoint is set and region is empty", () => {
    const setting: AwsS3Setting = {
      accessKeyId: "test-key",
      secretAccessKey: "test-secret",
      region: "",
      bucketName: "test-bucket",
      path: "/images/{filename}",
      customDomainName: "",
      endpoint: "https://minio.example.com",
    };

    new AwsS3Uploader(setting);

    const callArgs = mockS3Client.getLastCallArgs();
    expect(callArgs.endpoint).toBe("https://minio.example.com");
    expect(callArgs.forcePathStyle).toBe(true);
    expect(callArgs.region).toBe("us-east-1");
  });

  it("should use region value when provided", () => {
    const setting: AwsS3Setting = {
      accessKeyId: "test-key",
      secretAccessKey: "test-secret",
      region: "eu-west-1",
      bucketName: "test-bucket",
      path: "/images/{filename}",
      customDomainName: "",
      endpoint: "",
    };

    new AwsS3Uploader(setting);

    const callArgs = mockS3Client.getLastCallArgs();
    expect(callArgs.region).toBe("eu-west-1");
  });
});

describe("AwsS3Uploader upload URL generation", () => {
  beforeEach(() => {
    mockS3Client.resetLastCallArgs();
  });

  it("returns path-style URL when endpoint is set", async () => {
    const setting: AwsS3Setting = {
      accessKeyId: "test-key",
      secretAccessKey: "test-secret",
      region: "",
      bucketName: "test-bucket",
      path: "/images/{filename}",
      customDomainName: "",
      endpoint: "https://minio.example.com",
    };

    const uploader = new AwsS3Uploader(setting);
    const file = new File(["hello"], "image.png", {type: "image/png"});
    const url = await uploader.upload(file, "/tmp/image.png");

    expect(url).toBe("https://minio.example.com/test-bucket/images/image.png");
  });

  it("returns custom domain URL when customDomainName is set alongside endpoint", async () => {
    const setting: AwsS3Setting = {
      accessKeyId: "test-key",
      secretAccessKey: "test-secret",
      region: "",
      bucketName: "test-bucket",
      path: "{filename}",
      customDomainName: "media.example.com",
      endpoint: "https://minio.example.com",
    };

    const uploader = new AwsS3Uploader(setting);
    const file = new File(["hello"], "photo.png", {type: "image/png"});
    const url = await uploader.upload(file, "/tmp/photo.png");

    expect(url).toBe("https://media.example.com/photo.png");
  });

  it("returns default AWS virtual-hosted URL when no endpoint or customDomainName is set", async () => {
    const setting: AwsS3Setting = {
      accessKeyId: "test-key",
      secretAccessKey: "test-secret",
      region: "eu-west-1",
      bucketName: "my-bucket",
      path: "uploads/{filename}",
      customDomainName: "",
      endpoint: "",
    };

    const uploader = new AwsS3Uploader(setting);
    const file = new File(["hello"], "doc.png", {type: "image/png"});
    const url = await uploader.upload(file, "/tmp/doc.png");

    expect(url).toBe("https://my-bucket.s3.eu-west-1.amazonaws.com/uploads/doc.png");
  });

  it("sends PutObjectCommand with the correct bucket and key", async () => {
    const setting: AwsS3Setting = {
      accessKeyId: "test-key",
      secretAccessKey: "test-secret",
      region: "",
      bucketName: "test-bucket",
      path: "dir/{filename}",
      customDomainName: "",
      endpoint: "https://minio.example.com",
    };

    const uploader = new AwsS3Uploader(setting);
    const file = new File(["hello"], "img.png", {type: "image/png"});
    await uploader.upload(file, "/tmp/img.png");

    const sendMock = mockS3Client.getLastSendMock();
    expect(sendMock).toHaveBeenCalledTimes(1);
    const command = sendMock.mock.calls[0][0];
    expect(command.input.Bucket).toBe("test-bucket");
    expect(command.input.Key).toBe("dir/img.png");
  });
});