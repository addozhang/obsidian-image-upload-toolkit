import { describe, expect, it } from "vitest";
import { AwsS3Setting } from "../../src/uploader/s3/awsS3Uploader";

describe("AwsS3Setting interface", () => {
  it("should have endpoint field", () => {
    const setting: AwsS3Setting = {
      accessKeyId: "test-key",
      secretAccessKey: "test-secret",
      region: "us-east-1",
      bucketName: "test-bucket",
      path: "/images/{filename}",
      customDomainName: "",
      endpoint: "https://custom-s3.example.com",
    };
    expect(setting.endpoint).toBe("https://custom-s3.example.com");
  });

  it("should allow empty endpoint", () => {
    const setting: AwsS3Setting = {
      accessKeyId: "test-key",
      secretAccessKey: "test-secret",
      region: "us-east-1",
      bucketName: "test-bucket",
      path: "/images/{filename}",
      customDomainName: "",
      endpoint: "",
    };
    expect(setting.endpoint).toBe("");
  });
});
