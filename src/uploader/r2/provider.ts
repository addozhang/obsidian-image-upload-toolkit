import {Setting} from "obsidian";
import type ObsidianPublish from "../../publish";
import ImageStore from "../../imageStore";
import type {ProviderDescriptor} from "../../providers/types";
import R2Uploader from "./r2Uploader";

function drawSettings(parentEl: HTMLElement, plugin: ObsidianPublish): void {
    new Setting(parentEl)
        .setName('Cloudflare R2 access key ID')
        .setDesc('Your Cloudflare R2 access key ID.')
        .addText(text => text
            .setPlaceholder('Enter your access key ID')
            .setValue(plugin.settings.r2Setting?.accessKeyId || '')
            .onChange(value => plugin.settings.r2Setting.accessKeyId = value
            ));

    new Setting(parentEl)
        .setName('Cloudflare R2 secret access key')
        .setDesc('Your Cloudflare R2 secret access key.')
        .addText(text => text
            .setPlaceholder('Enter your secret access key')
            .setValue(plugin.settings.r2Setting?.secretAccessKey || '')
            .onChange(value => plugin.settings.r2Setting.secretAccessKey = value));

    new Setting(parentEl)
        .setName('Cloudflare R2 endpoint')
        .setDesc('Your Cloudflare R2 endpoint URL (e.g., https://account-id.r2.cloudflarestorage.com).')
        .addText(text => text
            .setPlaceholder('Enter your R2 endpoint')
            .setValue(plugin.settings.r2Setting?.endpoint || '')
            .onChange(value => plugin.settings.r2Setting.endpoint = value));

    new Setting(parentEl)
        .setName('Cloudflare R2 bucket name')
        .setDesc('Your Cloudflare R2 bucket name.')
        .addText(text => text
            .setPlaceholder('Enter your bucket name')
            .setValue(plugin.settings.r2Setting?.bucketName || '')
            .onChange(value => plugin.settings.r2Setting.bucketName = value));

    new Setting(parentEl)
        .setName("Target path")
        .setDesc("The path to store images. Supports {year} {mon} {day} {random} {filename} vars. For example, /{year}/{mon}/{day}/{filename} with uploading pic.jpg stores it as /2023/06/08/pic.jpg.")
        .addText(text =>
            text
                .setPlaceholder("Enter path")
                .setValue(plugin.settings.r2Setting.path)
                .onChange(value => plugin.settings.r2Setting.path = value));

    //custom domain
    new Setting(parentEl)
        .setName("R2.dev URL or custom domain name")
        .setDesc("You can use the R2.dev URL such as https://pub-xxxx.r2.dev, or a custom domain. If the custom domain name is example.com, you can use https://example.com/pic.jpg to access pic.img.")
        .addText(text =>
            text
                .setPlaceholder("Enter domain name")
                .setValue(plugin.settings.r2Setting.customDomainName)
                .onChange(value => plugin.settings.r2Setting.customDomainName = value));
}

export const CLOUDFLARE_R2_PROVIDER: ProviderDescriptor = {
    store: ImageStore.CLOUDFLARE_R2,
    build: settings => new R2Uploader(settings.r2Setting),
    isHosted: (url, settings) => {
        const hostname = new URL(url).hostname;
        if (settings.r2Setting?.customDomainName) {
            return hostname.includes(settings.r2Setting.customDomainName);
        }
        return hostname.includes("r2.dev") || hostname.includes("r2.cloudflarestorage.com");
    },
    drawSettings,
};
