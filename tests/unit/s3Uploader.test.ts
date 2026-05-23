import {beforeEach, describe, expect, it, vi} from "vitest";
import {AwsS3Setting, default as AwsS3Uploader} from "../../src/uploader/s3/awsS3Uploader";

const { mockS3Client } = vi.hoisted(() => {
  let lastCallArgs: any = null;
  const MockClass = function(args: any) {
    lastCallArgs = args;
    return { send: vi.fn() };
  };
  (MockClass as any).getLastCallArgs = () => lastCallArgs;
  (MockClass as any).resetLastCallArgs = () => { lastCallArgs = null; };
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