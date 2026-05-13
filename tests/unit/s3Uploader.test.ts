import {beforeEach, describe, expect, it, vi, afterEach} from "vitest";
import {AwsS3Setting, default as AwsS3Uploader} from "../../src/uploader/s3/awsS3Uploader";

const { mockS3Instance } = vi.hoisted(() => {
  let lastCallArgs: any = null;
  const MockClass = function(args: any) {
    lastCallArgs = args;
    return {};
  };
  (MockClass as any).getLastCallArgs = () => lastCallArgs;
  (MockClass as any).resetLastCallArgs = () => { lastCallArgs = null; };
  return { mockS3Instance: MockClass };
});

vi.mock('aws-sdk', () => {
  return {
    default: {
      S3: mockS3Instance
    }
  };
});

describe("AwsS3Uploader constructor", () => {
  beforeEach(() => {
    mockS3Instance.resetLastCallArgs();
  });

  it("should trim endpoint and set s3ForcePathStyle when endpoint is provided", () => {
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

    const callArgs = mockS3Instance.getLastCallArgs();
    expect(callArgs.endpoint).toBe("https://custom-s3.example.com");
    expect(callArgs.s3ForcePathStyle).toBe(true);
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

    const callArgs = mockS3Instance.getLastCallArgs();
    expect(callArgs.endpoint).toBeUndefined();
    expect(callArgs.s3ForcePathStyle).toBeUndefined();
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

    const callArgs = mockS3Instance.getLastCallArgs();
    expect(callArgs.endpoint).toBeUndefined();
    expect(callArgs.s3ForcePathStyle).toBeUndefined();
  });

  it("should not apply default region - keep empty string as empty", () => {
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

    const callArgs = mockS3Instance.getLastCallArgs();
    expect(callArgs.region).toBe("");
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

    const callArgs = mockS3Instance.getLastCallArgs();
    expect(callArgs.region).toBe("eu-west-1");
  });
});