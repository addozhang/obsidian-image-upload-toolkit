import {Setting} from "obsidian";
import type ObsidianPublish from "../../publish";
import ImageStore from "../../imageStore";
import type {ProviderDescriptor} from "../../providers/types";
import ImagekitUploader from "./imagekitUploader";

function imagekitSettingDescription() {
    const url = "https://imagekit.io/dashboard/developer/api-keys";
    return createFragment(frag => {
        frag.append("Obtain id and keys from ");
        frag.createEl("a", { text: url, href: url });
    });
}

function drawSettings(parentEl: HTMLElement, plugin: ObsidianPublish): void {
    new Setting(parentEl)
        .setName("ImageKit ID")
        .setDesc(imagekitSettingDescription())
        .addText(text =>
            text
                .setPlaceholder("Enter your ImageKit ID")
                .setValue(plugin.settings.imagekitSetting.imagekitID)
                .onChange(value => {
                    plugin.settings.imagekitSetting.imagekitID = value
                    plugin.settings.imagekitSetting.endpoint = `https://ik.imagekit.io/${value}/`
                }))

    new Setting(parentEl)
        .setName("Folder name")
        .setDesc("The directory name. Leave blank to upload to the root folder.")
        .addText(text =>
            text
                .setPlaceholder("Enter the folder name")
                .setValue(plugin.settings.imagekitSetting.folder)
                .onChange(value => plugin.settings.imagekitSetting.folder = value))

    new Setting(parentEl)
        .setName("Public key")
        .addText(text =>
            text
                .setPlaceholder("Enter your public key")
                .setValue(plugin.settings.imagekitSetting.publicKey)
                .onChange(value => plugin.settings.imagekitSetting.publicKey = value))

    new Setting(parentEl)
        .setName("Private key")
        .addText(text =>
            text
                .setPlaceholder("Enter your private key")
                .setValue(plugin.settings.imagekitSetting.privateKey)
                .onChange(value => plugin.settings.imagekitSetting.privateKey = value))
}

export const IMAGEKIT_PROVIDER: ProviderDescriptor = {
    store: ImageStore.ImageKit,
    build: settings => new ImagekitUploader(settings.imagekitSetting),
    isHosted: url => new URL(url).hostname.includes("imagekit.io"),
    drawSettings,
};
