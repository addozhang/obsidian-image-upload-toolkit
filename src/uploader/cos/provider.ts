import {Setting} from "obsidian";
import type ObsidianPublish from "../../publish";
import ImageStore from "../../imageStore";
import type {ProviderDescriptor} from "../../providers/types";
import {TencentCloudRegionList} from "./common";
import CosUploader from "./cosUploader";

function drawSettings(parentEl: HTMLElement, plugin: ObsidianPublish): void {
    new Setting(parentEl)
        .setName("Region")
        .setDesc("COS data center region.")
        .addDropdown(dropdown =>
            dropdown
                .addOptions(TencentCloudRegionList)
                .setValue(plugin.settings.cosSetting.region)
                .onChange(value => {
                    plugin.settings.cosSetting.region = value;
                })
        )
    new Setting(parentEl)
        .setName("Secret ID")
        .setDesc("The secret ID of Tencent Cloud.")
        .addText(text =>
            text
                .setPlaceholder("Enter secret ID")
                .setValue(plugin.settings.cosSetting.secretId)
                .onChange(value => plugin.settings.cosSetting.secretId = value))
    new Setting(parentEl)
        .setName("Secret key")
        .setDesc("The secret key of Tencent Cloud.")
        .addText(text =>
            text
                .setPlaceholder("Enter secret key")
                .setValue(plugin.settings.cosSetting.secretKey)
                .onChange(value => plugin.settings.cosSetting.secretKey = value))
    new Setting(parentEl)
        .setName("Bucket name")
        .setDesc("The name of the bucket to store images.")
        .addText(text =>
            text
                .setPlaceholder("Enter bucket name")
                .setValue(plugin.settings.cosSetting.bucket)
                .onChange(value => plugin.settings.cosSetting.bucket = value))

    new Setting(parentEl)
        .setName("Target path")
        .setDesc("The path to store images. Supports {year} {mon} {day} {random} {filename} vars. For example, /{year}/{mon}/{day}/{filename} with uploading pic.jpg stores it as /2023/06/08/pic.jpg.")
        .addText(text =>
            text
                .setPlaceholder("Enter path")
                .setValue(plugin.settings.cosSetting.path)
                .onChange(value => plugin.settings.cosSetting.path = value))

    //custom domain
    new Setting(parentEl)
        .setName("Custom domain name")
        .setDesc("If the custom domain name is example.com, you can use https://example.com/pic.jpg to access pic.img.")
        .addText(text =>
            text
                .setPlaceholder("Enter path")
                .setValue(plugin.settings.cosSetting.customDomainName)
                .onChange(value => plugin.settings.cosSetting.customDomainName = value))
}

export const COS_PROVIDER: ProviderDescriptor = {
    store: ImageStore.TENCENTCLOUD_COS,
    build: settings => new CosUploader(settings.cosSetting),
    isHosted: (url, settings) => {
        const hostname = new URL(url).hostname;
        if (settings.cosSetting?.customDomainName) {
            return hostname.includes(settings.cosSetting.customDomainName);
        }
        return hostname.includes("myqcloud.com");
    },
    drawSettings,
};
