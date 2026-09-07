import {Setting} from "obsidian";
import type ObsidianPublish from "../../publish";
import ImageStore from "../../imageStore";
import type {ProviderDescriptor} from "../../providers/types";
import ImgurAnonymousUploader from "./imgurAnonymousUploader";

function clientIdSettingDescription() {
    const url = "https://api.imgur.com/oauth2/addclient";
    return createFragment(frag => {
        frag.append("Generate your own Client ID at ");
        frag.createEl("a", { text: url, href: url });
    });
}

function drawSettings(parentEl: HTMLElement, plugin: ObsidianPublish): void {
    new Setting(parentEl)
        .setName("Client ID")
        .setDesc(clientIdSettingDescription())
        .addText(text =>
            text
                .setPlaceholder("Enter client ID")
                .setValue(plugin.settings.imgurAnonymousSetting.clientId)
                .onChange(value => plugin.settings.imgurAnonymousSetting.clientId = value)
        )
}

export const IMGUR_PROVIDER: ProviderDescriptor = {
    store: ImageStore.IMGUR,
    build: settings => new ImgurAnonymousUploader(settings.imgurAnonymousSetting.clientId),
    isHosted: url => {
        const hostname = new URL(url).hostname;
        return hostname.includes("imgur.com") || hostname.includes("i.imgur.com");
    },
    drawSettings,
};
