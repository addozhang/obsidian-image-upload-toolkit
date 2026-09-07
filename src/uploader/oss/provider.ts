import {Setting} from "obsidian";
import type ObsidianPublish from "../../publish";
import ImageStore from "../../imageStore";
import type {ProviderDescriptor} from "../../providers/types";
import {AliYunRegionList} from "./common";
import OssUploader from "./ossUploader";

function drawSettings(parentEl: HTMLElement, plugin: ObsidianPublish): void {
    new Setting(parentEl)
        .setName("Region")
        .setDesc("OSS data center region.")
        .addDropdown(dropdown =>
            dropdown
                .addOptions(AliYunRegionList)
                .setValue(plugin.settings.ossSetting.region)
                .onChange(value => {
                    plugin.settings.ossSetting.region = value;
                    plugin.settings.ossSetting.endpoint = `https://${value}.aliyuncs.com/`;
                })
        )
    new Setting(parentEl)
        .setName("Access key ID")
        .setDesc("The access key ID of Aliyun RAM.")
        .addText(text =>
            text
                .setPlaceholder("Enter access key ID")
                .setValue(plugin.settings.ossSetting.accessKeyId)
                .onChange(value => plugin.settings.ossSetting.accessKeyId = value))
    new Setting(parentEl)
        .setName("Access key secret")
        .setDesc("The access key secret of Aliyun RAM.")
        .addText(text =>
            text
                .setPlaceholder("Enter access key secret")
                .setValue(plugin.settings.ossSetting.accessKeySecret)
                .onChange(value => plugin.settings.ossSetting.accessKeySecret = value))
    new Setting(parentEl)
        .setName("Bucket name")
        .setDesc("The name of the bucket to store images.")
        .addText(text =>
            text
                .setPlaceholder("Enter bucket name")
                .setValue(plugin.settings.ossSetting.bucket)
                .onChange(value => plugin.settings.ossSetting.bucket = value))

    new Setting(parentEl)
        .setName("Target path")
        .setDesc("The path to store images. Supports {year} {mon} {day} {random} {filename} vars. For example, /{year}/{mon}/{day}/{filename} with uploading pic.jpg stores it as /2023/06/08/pic.jpg.")
        .addText(text =>
            text
                .setPlaceholder("Enter path")
                .setValue(plugin.settings.ossSetting.path)
                .onChange(value => plugin.settings.ossSetting.path = value))

    //custom domain
    new Setting(parentEl)
        .setName("Custom domain name")
        .setDesc("If the custom domain name is example.com, you can use https://example.com/pic.jpg to access pic.img.")
        .addText(text =>
            text
                .setPlaceholder("Enter path")
                .setValue(plugin.settings.ossSetting.customDomainName)
                .onChange(value => plugin.settings.ossSetting.customDomainName = value))
}

export const OSS_PROVIDER: ProviderDescriptor = {
    store: ImageStore.ALIYUN_OSS,
    build: settings => new OssUploader(settings.ossSetting),
    isHosted: (url, settings) => {
        const hostname = new URL(url).hostname;
        if (settings.ossSetting?.customDomainName) {
            return hostname.includes(settings.ossSetting.customDomainName);
        }
        return hostname.includes("aliyuncs.com");
    },
    drawSettings,
};
