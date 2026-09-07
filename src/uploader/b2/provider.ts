import {Setting} from "obsidian";
import type ObsidianPublish from "../../publish";
import ImageStore from "../../imageStore";
import type {ProviderDescriptor} from "../../providers/types";
import B2Uploader from "./b2Uploader";

function drawSettings(parentEl: HTMLElement, plugin: ObsidianPublish): void {
    new Setting(parentEl)
        .setName('Backblaze B2 access key ID')
        .setDesc('Your Backblaze B2 application key ID.')
        .addText(text => text
            .setPlaceholder('Enter your application key ID')
            .setValue(plugin.settings.b2Setting?.accessKeyId || '')
            .onChange(value => plugin.settings.b2Setting.accessKeyId = value
            ));

    new Setting(parentEl)
        .setName('Backblaze B2 secret access key')
        .setDesc('Your Backblaze B2 application key.')
        .addText(text => text
            .setPlaceholder('Enter your application key')
            .setValue(plugin.settings.b2Setting?.secretAccessKey || '')
            .onChange(value => plugin.settings.b2Setting.secretAccessKey = value));

    new Setting(parentEl)
        .setName('Backblaze B2 region')
        .setDesc('Your Backblaze B2 region (e.g., us-west-004).')
        .addText(text => text
            .setPlaceholder('Enter your region')
            .setValue(plugin.settings.b2Setting?.region || '')
            .onChange(value => plugin.settings.b2Setting.region = value));

    new Setting(parentEl)
        .setName('Backblaze B2 bucket name')
        .setDesc('Your Backblaze B2 bucket name.')
        .addText(text => text
            .setPlaceholder('Enter your bucket name')
            .setValue(plugin.settings.b2Setting?.bucketName || '')
            .onChange(value => plugin.settings.b2Setting.bucketName = value));

    new Setting(parentEl)
        .setName("Target path")
        .setDesc("The path to store images. Supports {year} {mon} {day} {random} {filename} vars. For example, /{year}/{mon}/{day}/{filename} with uploading pic.jpg stores it as /2023/06/08/pic.jpg.")
        .addText(text =>
            text
                .setPlaceholder("Enter path")
                .setValue(plugin.settings.b2Setting.path)
                .onChange(value => plugin.settings.b2Setting.path = value));

    //custom domain
    new Setting(parentEl)
        .setName("Custom domain name")
        .setDesc("If you have configured a custom domain, you can use https://example.com/pic.jpg to access pic.img. Otherwise, leave it empty to use the default B2 URL.")
        .addText(text =>
            text
                .setPlaceholder("Enter custom domain (optional)")
                .setValue(plugin.settings.b2Setting.customDomainName)
                .onChange(value => plugin.settings.b2Setting.customDomainName = value));
}

export const BACKBLAZE_B2_PROVIDER: ProviderDescriptor = {
    store: ImageStore.BACKBLAZE_B2,
    build: settings => new B2Uploader(settings.b2Setting),
    isHosted: (url, settings) => {
        const hostname = new URL(url).hostname;
        if (settings.b2Setting?.customDomainName) {
            return hostname.includes(settings.b2Setting.customDomainName);
        }
        return hostname.includes("backblazeb2.com");
    },
    drawSettings,
};
