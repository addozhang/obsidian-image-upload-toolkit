import {
    Notice,
    Plugin,
} from "obsidian";

import ImageTagProcessor, {ACTION_PUBLISH} from "./uploader/imageTagProcessor";
import ImageUploader from "./uploader/imageUploader";
import type {ImgurAnonymousSetting} from "./uploader/imgur/imgurAnonymousUploader";
import {IMGUR_PLUGIN_CLIENT_ID} from "./uploader/imgur/constants";
import ImageStore from "./imageStore";
import buildUploader from "./uploader/imageUploaderBuilder";
import PublishSettingTab from "./ui/publishSettingTab";
import type {OssSetting} from "./uploader/oss/ossUploader";
import type {ImagekitSetting} from "./uploader/imagekit/imagekitUploader";
import type {AwsS3Setting} from "./uploader/s3/awsS3Uploader";
import type {CosSetting} from "./uploader/cos/cosUploader";
import type {KodoSetting} from "./uploader/qiniu/kodoUploader";
import type {GitHubSetting} from "./uploader/github/gitHubUploader";
import type {R2Setting} from "./uploader/r2/r2Uploader";
import type {B2Setting} from "./uploader/b2/b2Uploader";

export interface PublishSettings {
    imageAltText: boolean;
    replaceOriginalDoc: boolean;
    ignoreProperties: boolean;
    imageStore: string;
    showProgressModal: boolean; // New setting to control progress modal display
    uploadWebImages: boolean; // New setting to enable web image upload
    convertMermaid: boolean; // Convert mermaid code blocks to PNG images on publish
    mermaidScale: number; // Canvas scale factor for mermaid PNG export (1–4, default 2)
    mermaidTheme: string; // Mermaid render theme: default, dark, forest, neutral, base
    //Imgur Anonymous setting
    imgurAnonymousSetting: ImgurAnonymousSetting;
    ossSetting: OssSetting;
    imagekitSetting: ImagekitSetting;
    awsS3Setting: AwsS3Setting;
    cosSetting: CosSetting;
    kodoSetting: KodoSetting;
    githubSetting: GitHubSetting;
    r2Setting: R2Setting;
    b2Setting: B2Setting;
}

const DEFAULT_SETTINGS: PublishSettings = {
    imageAltText: true,
    replaceOriginalDoc: false,
    ignoreProperties: true,
    imageStore: ImageStore.IMGUR.id,
    showProgressModal: true, // Default to showing the modal
    uploadWebImages: false, // Default to disabled for backward compatibility
    convertMermaid: false, // Default to disabled
    mermaidScale: 2, // 2x for crisp output on retina displays
    mermaidTheme: "default",
    imgurAnonymousSetting: {clientId: IMGUR_PLUGIN_CLIENT_ID},
    ossSetting: {
        region: "oss-cn-hangzhou",
        accessKeyId: "",
        accessKeySecret: "",
        bucket: "",
        endpoint: "https://oss-cn-hangzhou.aliyuncs.com/",
        path: "",
        customDomainName: "",
    },
    imagekitSetting: {
        endpoint: "",
        imagekitID: "",
        privateKey: "",
        publicKey: "",
        folder: "",
    },
    awsS3Setting: {
        accessKeyId: "",
        secretAccessKey: "",
        region: "",
        bucketName: "",
        path: "",
        customDomainName: "",
    },
    cosSetting: {
        region: "",
        bucket: "",
        secretId: "",
        secretKey: "",
        path: "",
        customDomainName: "",
    },
    kodoSetting: {
        accessKey: "",
        secretKey: "",
        bucket: "",
        customDomainName: "",
        path: ""
    },
    githubSetting: {
        repositoryName: "",
        branchName: "main",
        token: "",
        path: "images"
    },
    r2Setting: {
        accessKeyId: "",
        secretAccessKey: "",
        endpoint: "",
        bucketName: "",
        path: "",
        customDomainName: "",
    },
    b2Setting: {
        accessKeyId: "",
        secretAccessKey: "",
        region: "",
        bucketName: "",
        path: "",
        customDomainName: "",
    },
};
export default class ObsidianPublish extends Plugin {
    settings: PublishSettings;
    imageTagProcessor: ImageTagProcessor;
    imageUploader: ImageUploader;
    statusBarItem: HTMLElement;

    async onload() {
        await this.loadSettings();
        // Create status bar item that will be used if modal is disabled
        this.statusBarItem = this.addStatusBarItem();
        this.setupImageUploader();
        
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
            // Create ImageTagProcessor with the user's preference for modal vs status bar
            this.imageTagProcessor = new ImageTagProcessor(
                this.app, 
                this.settings, 
                this.imageUploader, 
                this.settings.showProgressModal, // Use modal based on setting
            );
        } catch (e) {
            console.log(`Failed to setup image uploader: ${e}`)
        }
    }
}