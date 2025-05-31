import {App, Notice, PluginSettingTab, Setting} from "obsidian";
import ObsidianPublish from "../publish";
import ImageStore from "../imageStore";
import {AliYunRegionList} from "../uploader/oss/common";
import {TencentCloudRegionList} from "../uploader/cos/common";

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
        containerEl.createEl("h1", {text: "Upload Settings"});

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
                        const isRelativePath = value.match(/^\./)
                        const pathExist = this.app.vault.getAbstractFileByPath(value)
                        if (!isRelativePath && !pathExist) {
                            new Notice(`Attachment location "${value}" not exist!`)
                            return
                        }
                        this.plugin.settings.attachmentLocation = value;

                    })
            );

        new Setting(imageStoreTypeDiv)
            .setName("Use image name as Alt Text")
            .setDesc("Whether to use image name as Alt Text with '-' and '_' replaced with space.")
            .addToggle(toggle =>
                toggle
                    .setValue(this.plugin.settings.imageAltText)
                    .onChange(value => this.plugin.settings.imageAltText = value)
            );

        new Setting(imageStoreTypeDiv)
            .setName("Update original document")
            .setDesc("Whether to replace internal link with store link.")
            .addToggle(toggle =>
                toggle
                    .setValue(this.plugin.settings.replaceOriginalDoc)
                    .onChange(value => this.plugin.settings.replaceOriginalDoc = value)
            );

        new Setting(imageStoreTypeDiv)
            .setName("Ignore note properties")
            .setDesc("Where to ignore note properties when copying to clipboard. This won't affect original note.")
            .addToggle(toggle =>
                toggle
                    .setValue(this.plugin.settings.ignoreProperties)
                    .onChange(value => this.plugin.settings.ignoreProperties = value)
            );

        // Add new setting for controlling progress modal display
        new Setting(imageStoreTypeDiv)
            .setName("Show progress modal")
            .setDesc("Show a modal dialog with detailed progress when uploading images (auto close in 3s). If disabled, a simpler status indicator will be used.")
            .addToggle(toggle =>
                toggle
                    .setValue(this.plugin.settings.showProgressModal)
                    .onChange(value => this.plugin.settings.showProgressModal = value)
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
        this.drawImageStoreSettings(this.imageStoreDiv);
    }

    async hide(): Promise<any> {
        await this.plugin.saveSettings();
        this.plugin.setupImageUploader();
    }

    private async drawImageStoreSettings(parentEL: HTMLDivElement) {
        parentEL.empty();
        switch (this.plugin.settings.imageStore) {
            case ImageStore.IMGUR.id:
                this.drawImgurSetting(parentEL);
                break;
            case ImageStore.ALIYUN_OSS.id:
                this.drawOSSSetting(parentEL);
                break;
            case ImageStore.ImageKit.id:
                this.drawImageKitSetting(parentEL);
                break;
            case ImageStore.AWS_S3.id:
                this.drawAwsS3Setting(parentEL);
                break;
            case ImageStore.TENCENTCLOUD_COS.id:
                this.drawTencentCloudCosSetting(parentEL);
                break;
            case ImageStore.QINIU_KUDO.id:
                this.drawQiniuSetting(parentEL);
                break
            case ImageStore.GITHUB.id:
                this.drawGitHubSetting(parentEL);
                break;
            case ImageStore.CLOUDFLARE_R2.id:
                this.drawR2Setting(parentEL);
                break;
            default:
                throw new Error(
                    "Should not reach here!"
                )
        }
    }

    // Imgur Setting
    private drawImgurSetting(parentEL: HTMLDivElement) {
        new Setting(parentEL)
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
                    .addOptions(AliYunRegionList)
                    .setValue(this.plugin.settings.ossSetting.region)
                    .onChange(value => {
                        this.plugin.settings.ossSetting.region = value;
                        this.plugin.settings.ossSetting.endpoint = `https://${value}.aliyuncs.com/`;
                    })
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

        new Setting(parentEL)
            .setName("Target Path")
            .setDesc("The path to store image.\nSupport {year} {mon} {day} {random} {filename} vars. For example, /{year}/{mon}/{day}/{filename} with uploading pic.jpg, it will store as /2023/06/08/pic.jpg.")
            .addText(text =>
                text
                    .setPlaceholder("Enter path")
                    .setValue(this.plugin.settings.ossSetting.path)
                    .onChange(value => this.plugin.settings.ossSetting.path = value))

        //custom domain
        new Setting(parentEL)
            .setName("Custom Domain Name")
            .setDesc("If the custom domain name is example.com, you can use https://example.com/pic.jpg to access pic.img.")
            .addText(text =>
                text
                    .setPlaceholder("Enter path")
                    .setValue(this.plugin.settings.ossSetting.customDomainName)
                    .onChange(value => this.plugin.settings.ossSetting.customDomainName = value))
    }

    private drawImageKitSetting(parentEL: HTMLDivElement) {
        new Setting(parentEL)
            .setName("Imagekit ID")
            .setDesc(PublishSettingTab.imagekitSettingDescription())
            .addText(text =>
                text
                    .setPlaceholder("Enter your ImagekitID")
                    .setValue(this.plugin.settings.imagekitSetting.imagekitID)
                    .onChange(value => {
                        this.plugin.settings.imagekitSetting.imagekitID = value
                        this.plugin.settings.imagekitSetting.endpoint = `https://ik.imagekit.io/${value}/`
                    }))

        new Setting(parentEL)
            .setName("Folder name")
            .setDesc("Please enter the directory name, otherwise leave it blank")
            .addText(text =>
                text
                    .setPlaceholder("Enter the folder name")
                    .setValue(this.plugin.settings.imagekitSetting.folder)
                    .onChange(value => this.plugin.settings.imagekitSetting.folder = value))

        new Setting(parentEL)
            .setName("Public Key")
            .addText(text =>
                text
                    .setPlaceholder("Enter your Public Key")
                    .setValue(this.plugin.settings.imagekitSetting.publicKey)
                    .onChange(value => this.plugin.settings.imagekitSetting.publicKey = value))

        new Setting(parentEL)
            .setName("Private Key")
            .addText(text =>
                text
                    .setPlaceholder("Enter your Private Key")
                    .setValue(this.plugin.settings.imagekitSetting.privateKey)
                    .onChange(value => this.plugin.settings.imagekitSetting.privateKey = value))
    }

    private static imagekitSettingDescription() {
        const fragment = document.createDocumentFragment();
        const a = document.createElement("a");
        const url = "https://imagekit.io/dashboard/developer/api-keys";
        a.textContent = url;
        a.setAttribute("href", url);
        fragment.append("Obtain id and keys from ");
        fragment.append(a);
        return fragment;
    }

    private drawAwsS3Setting(parentEL: HTMLDivElement) {
        // Add AWS S3 configuration section
        new Setting(parentEL)
            .setName('AWS S3 Access Key ID')
            .setDesc('Your AWS S3 access key ID')
            .addText(text => text
                .setPlaceholder('Enter your access key ID')
                .setValue(this.plugin.settings.awsS3Setting?.accessKeyId || '')
                .onChange(value => this.plugin.settings.awsS3Setting.accessKeyId = value
                ));

        new Setting(parentEL)
            .setName('AWS S3 Secret Access Key')
            .setDesc('Your AWS S3 secret access key')
            .addText(text => text
                .setPlaceholder('Enter your secret access key')
                .setValue(this.plugin.settings.awsS3Setting?.secretAccessKey || '')
                .onChange(value => this.plugin.settings.awsS3Setting.secretAccessKey = value));

        new Setting(parentEL)
            .setName('AWS S3 Region')
            .setDesc('Your AWS S3 region')
            .addText(text => text
                .setPlaceholder('Enter your region')
                .setValue(this.plugin.settings.awsS3Setting?.region || '')
                .onChange(value => this.plugin.settings.awsS3Setting.region = value));

        new Setting(parentEL)
            .setName('AWS S3 Bucket Name')
            .setDesc('Your AWS S3 bucket name')
            .addText(text => text
                .setPlaceholder('Enter your bucket name')
                .setValue(this.plugin.settings.awsS3Setting?.bucketName || '')
                .onChange(value => this.plugin.settings.awsS3Setting.bucketName = value));
        new Setting(parentEL)
            .setName("Target Path")
            .setDesc("The path to store image.\nSupport {year} {mon} {day} {random} {filename} vars. For example, /{year}/{mon}/{day}/{filename} with uploading pic.jpg, it will store as /2023/06/08/pic.jpg.")
            .addText(text =>
                text
                    .setPlaceholder("Enter path")
                    .setValue(this.plugin.settings.awsS3Setting.path)
                    .onChange(value => this.plugin.settings.awsS3Setting.path = value))

        //custom domain
        new Setting(parentEL)
            .setName("Custom Domain Name")
            .setDesc("If the custom domain name is example.com, you can use https://example.com/pic.jpg to access pic.img.")
            .addText(text =>
                text
                    .setPlaceholder("Enter path")
                    .setValue(this.plugin.settings.awsS3Setting.customDomainName)
                    .onChange(value => this.plugin.settings.awsS3Setting.customDomainName = value))
    }

    private drawTencentCloudCosSetting(parentEL: HTMLDivElement) {
        new Setting(parentEL)
            .setName("Region")
            .setDesc("COS data center region.")
            .addDropdown(dropdown =>
                dropdown
                    .addOptions(TencentCloudRegionList)
                    .setValue(this.plugin.settings.cosSetting.region)
                    .onChange(value => {
                        this.plugin.settings.cosSetting.region = value;
                    })
            )
        new Setting(parentEL)
            .setName("Secret Id")
            .setDesc("The secret id of TencentCloud.")
            .addText(text =>
                text
                    .setPlaceholder("Enter access key id")
                    .setValue(this.plugin.settings.cosSetting.secretId)
                    .onChange(value => this.plugin.settings.cosSetting.secretId = value))
        new Setting(parentEL)
            .setName("Secret Key")
            .setDesc("The secret key of TencentCloud.")
            .addText(text =>
                text
                    .setPlaceholder("Enter access key secret")
                    .setValue(this.plugin.settings.cosSetting.secretKey)
                    .onChange(value => this.plugin.settings.cosSetting.secretKey = value))
        new Setting(parentEL)
            .setName("Access Bucket Name")
            .setDesc("The name of bucket to store images.")
            .addText(text =>
                text
                    .setPlaceholder("Enter bucket name")
                    .setValue(this.plugin.settings.cosSetting.bucket)
                    .onChange(value => this.plugin.settings.cosSetting.bucket = value))

        new Setting(parentEL)
            .setName("Target Path")
            .setDesc("The path to store image.\nSupport {year} {mon} {day} {random} {filename} vars. For example, /{year}/{mon}/{day}/{filename} with uploading pic.jpg, it will store as /2023/06/08/pic.jpg.")
            .addText(text =>
                text
                    .setPlaceholder("Enter path")
                    .setValue(this.plugin.settings.cosSetting.path)
                    .onChange(value => this.plugin.settings.cosSetting.path = value))

        //custom domain
        new Setting(parentEL)
            .setName("Custom Domain Name")
            .setDesc("If the custom domain name is example.com, you can use https://example.com/pic.jpg to access pic.img.")
            .addText(text =>
                text
                    .setPlaceholder("Enter path")
                    .setValue(this.plugin.settings.cosSetting.customDomainName)
                    .onChange(value => this.plugin.settings.cosSetting.customDomainName = value))
    }

    private drawQiniuSetting(parentEL: HTMLDivElement) {
        new Setting(parentEL)
            .setName("Access Key")
            .setDesc("The access key of Qiniu.")
            .addText(text =>
                text
                    .setPlaceholder("Enter access key")
                    .setValue(this.plugin.settings.kodoSetting.accessKey)
                    .onChange(value => this.plugin.settings.kodoSetting.accessKey = value))
        new Setting(parentEL)
            .setName("Secret Key")
            .setDesc("The secret key of Qiniu.")
            .addText(text =>
                text
                    .setPlaceholder("Enter secret key")
                    .setValue(this.plugin.settings.kodoSetting.secretKey)
                    .onChange(value => this.plugin.settings.kodoSetting.secretKey = value))
        new Setting(parentEL)
            .setName("Bucket Name")
            .setDesc("The name of bucket to store images.")
            .addText(text =>
                text
                    .setPlaceholder("Enter bucket name")
                    .setValue(this.plugin.settings.kodoSetting.bucket)
                    .onChange(value => this.plugin.settings.kodoSetting.bucket = value))

        // new Setting(parentEL)
        //     .setName("Target Path")
        //     .setDesc("The path to store image.\nSupport {year} {mon} {day} {random} {filename} vars. For example, /{year}/{mon}/{day}/{filename} with uploading pic.jpg, it will store as /2023/06/08/pic.jpg.")
        //     .addText(text =>
        //         text
        //             .setPlaceholder("Enter path")
        //             .setValue(this.plugin.settings.kodoSetting.path)
        //             .onChange(value => this.plugin.settings.kodoSetting.path = value))

        //custom domain
        new Setting(parentEL)
            .setName("Custom Domain Name")
            .setDesc("If the custom domain name is example.com, you can use https://example.com/pic.jpg to access pic.img.")
            .addText(text =>
                text
                    .setPlaceholder("Enter path")
                    .setValue(this.plugin.settings.kodoSetting.customDomainName)
                    .onChange(value => this.plugin.settings.kodoSetting.customDomainName = value))
    }

    private drawGitHubSetting(parentEL: HTMLDivElement) {
        new Setting(parentEL)
            .setName("Repository Name")
            .setDesc("The name of the GitHub repository to store images (format: owner/repo).")
            .addText(text =>
                text
                    .setPlaceholder("Enter repository name (e.g., username/repo)")
                    .setValue(this.plugin.settings.githubSetting.repositoryName)
                    .onChange(value => this.plugin.settings.githubSetting.repositoryName = value)
            );

        new Setting(parentEL)
            .setName("Branch Name")
            .setDesc("The branch to store images in (defaults to 'main').")
            .addText(text =>
                text
                    .setPlaceholder("Enter branch name")
                    .setValue(this.plugin.settings.githubSetting.branchName)
                    .onChange(value => this.plugin.settings.githubSetting.branchName = value)
            );

        new Setting(parentEL)
            .setName("Personal Access Token")
            .setDesc(PublishSettingTab.githubTokenDescription())
            .addText(text =>
                text
                    .setPlaceholder("Enter your GitHub personal access token")
                    .setValue(this.plugin.settings.githubSetting.token)
                    .onChange(value => this.plugin.settings.githubSetting.token = value)
            );

        /*new Setting(parentEL)
            .setName("Target Path")
            .setDesc("The path to store images within the repository.\nSupport {year} {mon} {day} {random} {filename} vars. For example, images/{year}/{mon}/{day}/{filename} with uploading pic.jpg, it will store as images/2023/06/08/pic.jpg.")
            .addText(text =>
                text
                    .setPlaceholder("Enter path")
                    .setValue(this.plugin.settings.githubSetting.path)
                    .onChange(value => this.plugin.settings.githubSetting.path = value)
            );*/
    }

    private static githubTokenDescription() {
        const fragment = document.createDocumentFragment();
        const a = document.createElement("a");
        const url = "https://github.com/settings/tokens";
        a.textContent = url;
        a.setAttribute("href", url);
        fragment.append("Generate a personal access token with 'repo' scope at ");
        fragment.append(a);
        return fragment;
    }

    private drawR2Setting(parentEL: HTMLDivElement) {
        new Setting(parentEL)
            .setName('Cloudflare R2 Access Key ID')
            .setDesc('Your Cloudflare R2 access key ID')
            .addText(text => text
                .setPlaceholder('Enter your access key ID')
                .setValue(this.plugin.settings.r2Setting?.accessKeyId || '')
                .onChange(value => this.plugin.settings.r2Setting.accessKeyId = value
                ));

        new Setting(parentEL)
            .setName('Cloudflare R2 Secret Access Key')
            .setDesc('Your Cloudflare R2 secret access key')
            .addText(text => text
                .setPlaceholder('Enter your secret access key')
                .setValue(this.plugin.settings.r2Setting?.secretAccessKey || '')
                .onChange(value => this.plugin.settings.r2Setting.secretAccessKey = value));

        new Setting(parentEL)
            .setName('Cloudflare R2 Endpoint')
            .setDesc('Your Cloudflare R2 endpoint URL (e.g., https://account-id.r2.cloudflarestorage.com)')
            .addText(text => text
                .setPlaceholder('Enter your R2 endpoint')
                .setValue(this.plugin.settings.r2Setting?.endpoint || '')
                .onChange(value => this.plugin.settings.r2Setting.endpoint = value));

        new Setting(parentEL)
            .setName('Cloudflare R2 Bucket Name')
            .setDesc('Your Cloudflare R2 bucket name')
            .addText(text => text
                .setPlaceholder('Enter your bucket name')
                .setValue(this.plugin.settings.r2Setting?.bucketName || '')
                .onChange(value => this.plugin.settings.r2Setting.bucketName = value));

        new Setting(parentEL)
            .setName("Target Path")
            .setDesc("The path to store image.\nSupport {year} {mon} {day} {random} {filename} vars. For example, /{year}/{mon}/{day}/{filename} with uploading pic.jpg, it will store as /2023/06/08/pic.jpg.")
            .addText(text =>
                text
                    .setPlaceholder("Enter path")
                    .setValue(this.plugin.settings.r2Setting.path)
                    .onChange(value => this.plugin.settings.r2Setting.path = value));

        //custom domain
        new Setting(parentEL)
            .setName("R2.dev URL, Custom Domain Name")
            .setDesc("You can use the R2.dev URL such as https://pub-xxxx.r2.dev here, or custom domain. If the custom domain name is example.com, you can use https://example.com/pic.jpg to access pic.img.")
            .addText(text =>
                text
                    .setPlaceholder("Enter domain name")
                    .setValue(this.plugin.settings.r2Setting.customDomainName)
                    .onChange(value => this.plugin.settings.r2Setting.customDomainName = value));
    }
}