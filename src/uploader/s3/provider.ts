import {Setting} from "obsidian";
import type ObsidianPublish from "../../publish";
import ImageStore from "../../imageStore";
import type {ProviderDescriptor} from "../../providers/types";
import AwsS3Uploader from "./awsS3Uploader";

function drawSettings(parentEl: HTMLElement, plugin: ObsidianPublish): void {
    // Add AWS S3 configuration section
    new Setting(parentEl)
        .setName('AWS S3 access key ID')
        .setDesc('Your AWS S3 access key ID.')
        .addText(text => text
            .setPlaceholder('Enter your access key ID')
            .setValue(plugin.settings.awsS3Setting?.accessKeyId || '')
            .onChange(value => plugin.settings.awsS3Setting.accessKeyId = value
            ));

    new Setting(parentEl)
        .setName('AWS S3 secret access key')
        .setDesc('Your AWS S3 secret access key.')
        .addText(text => text
            .setPlaceholder('Enter your secret access key')
            .setValue(plugin.settings.awsS3Setting?.secretAccessKey || '')
            .onChange(value => plugin.settings.awsS3Setting.secretAccessKey = value));

    new Setting(parentEl)
        .setName('AWS S3 region')
        .setDesc('Your AWS S3 region.')
        .addText(text => text
            .setPlaceholder('Enter your region')
            .setValue(plugin.settings.awsS3Setting?.region || '')
            .onChange(value => plugin.settings.awsS3Setting.region = value));

    new Setting(parentEl)
        .setName('AWS S3 bucket name')
        .setDesc('Your AWS S3 bucket name.')
        .addText(text => text
            .setPlaceholder('Enter your bucket name')
            .setValue(plugin.settings.awsS3Setting?.bucketName || '')
            .onChange(value => plugin.settings.awsS3Setting.bucketName = value));
    new Setting(parentEl)
        .setName("Target path")
        .setDesc("The path to store images. Supports {year} {mon} {day} {random} {filename} vars. For example, /{year}/{mon}/{day}/{filename} with uploading pic.jpg stores it as /2023/06/08/pic.jpg.")
        .addText(text =>
            text
                .setPlaceholder("Enter path")
                .setValue(plugin.settings.awsS3Setting.path)
                .onChange(value => plugin.settings.awsS3Setting.path = value))

    //custom domain
    new Setting(parentEl)
        .setName("Custom domain name")
        .setDesc("If the custom domain name is example.com, you can use https://example.com/pic.jpg to access pic.img.")
        .addText(text =>
            text
                .setPlaceholder("Enter path")
                .setValue(plugin.settings.awsS3Setting.customDomainName)
                .onChange(value => plugin.settings.awsS3Setting.customDomainName = value))
}

export const AWS_S3_PROVIDER: ProviderDescriptor = {
    store: ImageStore.AWS_S3,
    build: settings => new AwsS3Uploader(settings.awsS3Setting),
    isHosted: (url, settings) => {
        const hostname = new URL(url).hostname;
        if (settings.awsS3Setting?.customDomainName) {
            return hostname === settings.awsS3Setting.customDomainName;
        }
        // AwsS3Uploader only ever returns *.amazonaws.com hosts or the
        // configured custom domain — don't treat third-party ".s3." hosts
        // as ours
        return hostname.endsWith(".amazonaws.com");
    },
    drawSettings,
};
