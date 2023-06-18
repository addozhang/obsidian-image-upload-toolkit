import {
    Notice,
    Plugin,
} from "obsidian";

import ImageTagProcessor, {ACTION_PUBLISH} from "./uploader/imageTagProcessor";
import ImageUploader from "./uploader/imageUploader";
import {ImgurAnonymousSetting} from "./uploader/imgur/imgurAnonymousUploader";
import {IMGUR_PLUGIN_CLIENT_ID} from "./uploader/imgur/constants";
import ImageStore from "./imageStore";
import buildUploader from "./uploader/imageUploaderBuilder";
import PublishSettingTab from "./ui/publishSettingTab";
import {OssSetting} from "./uploader/oss/ossUploader";

export interface PublishSettings {
    imageAltText: boolean;
    replaceOriginalDoc: boolean
    attachmentLocation: string;
    imageStore: string;
    //Imgur Anonymous setting
    imgurAnonymousSetting: ImgurAnonymousSetting;
    ossSetting: OssSetting;
}

const DEFAULT_SETTINGS: PublishSettings = {
    imageAltText: true,
    replaceOriginalDoc: false,
    attachmentLocation: ".",
    imageStore: ImageStore.IMGUR.id,
    imgurAnonymousSetting: {clientId: IMGUR_PLUGIN_CLIENT_ID},
    ossSetting: {
        region: "oss-cn-hangzhou",
        accessKeyId: "",
        accessKeySecret: "",
        bucket: "",
        endpoint: "https://oss-cn-hangzhou.aliyuncs.com/",
        path: "",
        customDomainName: "",
    }
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
                if (!checking) {
                    this.publish()
                }
                return true;
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
        if (!this.imageUploader) {
            new Notice("Image uploader setup failed, please check setting.")
        } else {
            this.imageTagProcessor.process(ACTION_PUBLISH).then(() => {
            });
        }
    }

    setupImageUploader(): void {
        try {
            this.imageUploader = buildUploader(this.settings);
            this.imageTagProcessor = new ImageTagProcessor(this.app, this.settings, this.imageUploader);
        } catch (e) {
            console.log(`Failed to setup image uploader: ${e}`)
        }
    }
}