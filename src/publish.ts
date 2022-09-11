import {
    App, MarkdownView,
    Modal,
    Plugin,
} from "obsidian";

import ImageTagProcessor, {ACTION_PUBLISH, ACTION_REPLACE} from "./uploader/imageTagProcessor";
import ImageUploader from "./uploader/imageUploader";
import {ImgurAnonymousSetting} from "./uploader/imgur/imgurAnonymousUploader";
import {IMGUR_PLUGIN_CLIENT_ID} from "./uploader/imgur/constants";
import ImageStore from "./imageStore";
import buildUploader from "./uploader/imageUploaderBuilder";
import PublishSettingTab from "./ui/publishSettingTab";

export interface PublishSettings {
    attachmentLocation: string;
    imageStore: string;
    //Imgur Anonymous setting
    imgurAnonymousSetting: ImgurAnonymousSetting
}

const DEFAULT_SETTINGS: PublishSettings = {
    attachmentLocation: ".",
    imageStore: ImageStore.ANONYMOUS_IMGUR.id,
    imgurAnonymousSetting: {clientId: IMGUR_PLUGIN_CLIENT_ID}
};
export default class ObsidianPublish extends Plugin {
    settings: PublishSettings;
    imageTagProcessor: ImageTagProcessor;
    imageUploader: ImageUploader;

    async onload() {
        await this.loadSettings();
        this.setupImageUploader()
        this.addStatusBarItem().setText("Status Bar Text");
        this.addCommand({
            id: "publish-page",
            name: "Publish Page",
            checkCallback: (checking: boolean) => {
                let activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
                if (activeView) {
                    if (!checking) {
                        this.publish()
                    }
                    return true;
                }
                return false;
            }
        });
        this.addSettingTab(new PublishSettingTab(this.app, this));
    }

    onunload() {
        // console.log("unloading plugin");
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, (await this.loadData()) as PublishSettings);
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    private publish(): void {
        this.imageTagProcessor.process(ACTION_PUBLISH).then(() => {});
    }

    private upload(): void {
        this.imageTagProcessor.process(ACTION_REPLACE).then(() => {});
    }

    setupImageUploader(): void {
        this.imageUploader = buildUploader(this.settings);
        this.imageTagProcessor = new ImageTagProcessor(this.app, this.settings.attachmentLocation, this.imageUploader);
    }
}