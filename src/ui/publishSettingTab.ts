import {App, FileSystemAdapter, Notice, PluginSettingTab, Setting} from "obsidian";
import ObsidianPublish from "../publish";
import ImageStore from "../imageStore";
import {existsSync} from "fs";
import {join} from "path";
import {RegionList} from "../uploader/oss/common";

export default class PublishSettingTab extends PluginSettingTab {
    private plugin: ObsidianPublish;
    private imageStoreDiv: HTMLDivElement;

    constructor(app: App, plugin: ObsidianPublish) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): any {
        const {containerEl} = this;
        containerEl.empty()
        containerEl.createEl("h2", {text: "Publish Settings"});

        const imageStoreTypeDiv = containerEl.createDiv();
        this.imageStoreDiv = containerEl.createDiv();

        // Attachment location
        new Setting(imageStoreTypeDiv)
            .setName("Attachment location")
            .setDesc("The location storing images which will upload images from.")
            .addText(text =>
                text
                    .setPlaceholder("Enter folder name")
                    .setValue(this.plugin.settings.attachmentLocation)
                    .onChange(async (value) => {
                        if (!existsSync(join((this.app.vault.adapter as FileSystemAdapter).getBasePath(), value))) {
                            new Notice(`${value} doesn't exist`)
                            return
                        }
                        this.plugin.settings.attachmentLocation = value;

                    })
            );

        new Setting((imageStoreTypeDiv))
            .setName("Update original document.")
            .setDesc("Whether to replace internal link with store link.")
            .addToggle(toggle =>
                toggle
                    .setValue(this.plugin.settings.replaceOriginalDoc)
                    .onChange( value => this.plugin.settings.replaceOriginalDoc = value)
            );

        // Image Store
        new Setting(imageStoreTypeDiv)
            .setName("Image store")
            .setDesc("Remote image store for upload images to.")
            .addDropdown(dd => {
                ImageStore.lists.forEach(s => {
                    dd.addOption(s.id, s.description);
                });
                dd.setValue(this.plugin.settings.imageStore);
                dd.onChange(async (v) => {
                    this.plugin.settings.imageStore = v;
                    this.plugin.setupImageUploader();
                    await this.drawImageStoreSettings(this.imageStoreDiv);
                });
            });
        this.drawImageStoreSettings(this.imageStoreDiv).then(() => {
        }).finally(() => {
        })
    }

    async hide(): Promise<any> {
        await this.plugin.saveSettings();
        this.plugin.setupImageUploader();
    }

    private async drawImageStoreSettings(partentEL: HTMLDivElement) {
        partentEL.empty();
        switch (this.plugin.settings.imageStore) {
            case ImageStore.ANONYMOUS_IMGUR.id:
                this.drawAnonymousSetting(partentEL);
                break;
            case ImageStore.ALIYUN_OSS.id:
                this.drawOSSSetting(partentEL);
                break;
            default:
                throw new Error(
                    "Should not reach here!"
                )
        }
    }

    // Imgur Setting
    private drawAnonymousSetting(partentEL: HTMLDivElement) {
        new Setting(partentEL)
            .setName("Client ID")
            .setDesc(PublishSettingTab.clientIdSettingDescription())
            .addText(text =>
                text
                    .setPlaceholder("Enter client_id")
                    .setValue(this.plugin.settings.imgurAnonymousSetting.clientId)
                    .onChange(value => this.plugin.settings.imgurAnonymousSetting.clientId = value)
            )
    }

    private static clientIdSettingDescription() {
        const fragment = document.createDocumentFragment();
        const a = document.createElement("a");
        const url = "https://api.imgur.com/oauth2/addclient";
        a.textContent = url;
        a.setAttribute("href", url);
        fragment.append("Generate your own Client ID at ");
        fragment.append(a);
        return fragment;
    }

    // Aliyun OSS Setting
    private drawOSSSetting(parentEL: HTMLDivElement) {
        new Setting(parentEL)
            .setName("Region")
            .setDesc("OSS data center region.")
            .addDropdown(dropdown =>
                dropdown
                    .addOptions(RegionList)
                    .onChange(value => this.plugin.settings.ossSetting.region = value)
            )
        new Setting(parentEL)
            .setName("Access Key Id")
            .setDesc("The access key id of AliYun RAM.")
            .addText(text =>
                text
                    .setPlaceholder("Enter access key id")
                    .setValue(this.plugin.settings.ossSetting.accessKeyId)
                    .onChange(value => this.plugin.settings.ossSetting.accessKeyId = value))
        new Setting(parentEL)
            .setName("Access Key Secret")
            .setDesc("The access key secret of AliYun RAM.")
            .addText(text =>
                text
                    .setPlaceholder("Enter access key secret")
                    .setValue(this.plugin.settings.ossSetting.accessKeySecret)
                    .onChange(value => this.plugin.settings.ossSetting.accessKeySecret = value))
        new Setting(parentEL)
            .setName("Access Bucket Name")
            .setDesc("The name of bucket to store images.")
            .addText(text =>
                text
                    .setPlaceholder("Enter bucket name")
                    .setValue(this.plugin.settings.ossSetting.bucket)
                    .onChange(value => this.plugin.settings.ossSetting.bucket = value))
    }
}