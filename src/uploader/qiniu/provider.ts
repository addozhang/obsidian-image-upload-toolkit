import {Setting} from "obsidian";
import type ObsidianPublish from "../../publish";
import ImageStore from "../../imageStore";
import type {ProviderDescriptor} from "../../providers/types";
import KodoUploader from "./kodoUploader";

function drawSettings(parentEl: HTMLElement, plugin: ObsidianPublish): void {
    new Setting(parentEl)
        .setName("Access key")
        .setDesc("The access key of Qiniu.")
        .addText(text =>
            text
                .setPlaceholder("Enter access key")
                .setValue(plugin.settings.kodoSetting.accessKey)
                .onChange(value => plugin.settings.kodoSetting.accessKey = value))
    new Setting(parentEl)
        .setName("Secret key")
        .setDesc("The secret key of Qiniu.")
        .addText(text =>
            text
                .setPlaceholder("Enter secret key")
                .setValue(plugin.settings.kodoSetting.secretKey)
                .onChange(value => plugin.settings.kodoSetting.secretKey = value))
    new Setting(parentEl)
        .setName("Bucket name")
        .setDesc("The name of the bucket to store images.")
        .addText(text =>
            text
                .setPlaceholder("Enter bucket name")
                .setValue(plugin.settings.kodoSetting.bucket)
                .onChange(value => plugin.settings.kodoSetting.bucket = value))

    //custom domain
    new Setting(parentEl)
        .setName("Custom domain name")
        .setDesc("If the custom domain name is example.com, you can use https://example.com/pic.jpg to access pic.img.")
        .addText(text =>
            text
                .setPlaceholder("Enter path")
                .setValue(plugin.settings.kodoSetting.customDomainName)
                .onChange(value => plugin.settings.kodoSetting.customDomainName = value))
}

export const KODO_PROVIDER: ProviderDescriptor = {
    store: ImageStore.QINIU_KUDO,
    build: settings => new KodoUploader(settings.kodoSetting),
    isHosted: (url, settings) => {
        const hostname = new URL(url).hostname;
        if (settings.kodoSetting?.customDomainName) {
            return hostname.includes(settings.kodoSetting.customDomainName);
        }
        return hostname.includes("qiniudn.com") || hostname.includes("clouddn.com");
    },
    drawSettings,
};
