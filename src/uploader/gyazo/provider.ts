import {Setting} from "obsidian";
import type ObsidianPublish from "../../publish";
import ImageStore from "../../imageStore";
import type {ProviderDescriptor} from "../../providers/types";
import GyazoUploader from "./gyazoUploader";

function gyazoTokenSettingDescription() {
    const url = "https://gyazo.com/oauth/applications";
    return createFragment(frag => {
        frag.append("Create an application and issue an access token at ");
        frag.createEl("a", { text: url, href: url });
    });
}

function drawSettings(parentEl: HTMLElement, plugin: ObsidianPublish): void {
    new Setting(parentEl)
        .setName("Access token")
        .setDesc(gyazoTokenSettingDescription())
        .addText(text =>
            text
                .setPlaceholder("Enter access token")
                .setValue(plugin.settings.gyazoSetting.accessToken)
                .onChange(value => plugin.settings.gyazoSetting.accessToken = value)
        );

    new Setting(parentEl)
        .setName("Access policy")
        .setDesc("Set image visibility. Choose 'Only me' only if you do not need other people or external sites to access the uploaded image URL.")
        .addDropdown(dropdown =>
            dropdown
                .addOption("anyone", "Anyone")
                .addOption("only_me", "Only me")
                .setValue(plugin.settings.gyazoSetting.accessPolicy)
                .onChange((value: "anyone" | "only_me") => plugin.settings.gyazoSetting.accessPolicy = value)
        );

    new Setting(parentEl)
        .setName("Common description")
        .setDesc("A fixed Gyazo description applied to every upload. Leave empty to skip the description field.")
        .addText(text =>
            text
                .setPlaceholder("Enter a shared description (optional)")
                .setValue(plugin.settings.gyazoSetting.desc)
                .onChange(value => plugin.settings.gyazoSetting.desc = value)
        );
}

export const GYAZO_PROVIDER: ProviderDescriptor = {
    store: ImageStore.GYAZO,
    build: settings => new GyazoUploader(settings.gyazoSetting),
    isHosted: url => {
        const hostname = new URL(url).hostname;
        return hostname.includes("gyazo.com") || hostname.includes("i.gyazo.com") || hostname.includes("thumb.gyazo.com");
    },
    drawSettings,
};
