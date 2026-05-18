import {App, PluginSettingTab, Setting} from "obsidian";
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

    display(): unknown {
        const {containerEl} = this;
        containerEl.empty()
        this.plugin.settings.imageStore = ImageStore.normalizeId(this.plugin.settings.imageStore);

        // ── General ──
        ;

        new Setting(containerEl)
            .setName("Use image name as alt text")
            .setDesc("Use the image name as alt text, replacing '-' and '_' with spaces.")
            .addToggle(toggle =>
                toggle
                    .setValue(this.plugin.settings.imageAltText)
                    .onChange(value => this.plugin.settings.imageAltText = value)
            );

        new Setting(containerEl)
            .setName("Update original document")
            .setDesc("Whether to replace internal link with store link.")
            .addToggle(toggle =>
                toggle
                    .setValue(this.plugin.settings.replaceOriginalDoc)
                    .onChange(value => this.plugin.settings.replaceOriginalDoc = value)
            );

        new Setting(containerEl)
            .setName("Ignore note properties")
            .setDesc("Where to ignore note properties when copying to clipboard. This won't affect original note.")
            .addToggle(toggle =>
                toggle
                    .setValue(this.plugin.settings.ignoreProperties)
                    .onChange(value => this.plugin.settings.ignoreProperties = value)
            );

        // ── Upload ──
        new Setting(containerEl).setName("Upload").setHeading();

        new Setting(containerEl)
            .setName("Show progress modal")
            .setDesc("Show a modal dialog with detailed progress when uploading images (auto close in 3s). If disabled, a simpler status indicator will be used.")
            .addToggle(toggle =>
                toggle
                    .setValue(this.plugin.settings.showProgressModal)
                    .onChange(value => this.plugin.settings.showProgressModal = value)
            );

        new Setting(containerEl)
            .setName("Upload web images")
            .setDesc("When enabled, web images (http/https URLs) are downloaded and re-uploaded to your configured storage. Images already hosted on your storage service are skipped.")
            .addToggle(toggle =>
                toggle
                    .setValue(this.plugin.settings.uploadWebImages)
                    .onChange(value => this.plugin.settings.uploadWebImages = value)
            );

        // ── Mermaid ──
        new Setting(containerEl).setName("Mermaid").setHeading();

        new Setting(containerEl)
            .setName("Convert Mermaid diagrams to images")
            .setDesc("Render Mermaid code blocks as PNG images and upload them during publish.")
            .addToggle(toggle =>
                toggle
                    .setValue(this.plugin.settings.convertMermaid)
                    .onChange(value => this.plugin.settings.convertMermaid = value)
            );

        new Setting(containerEl)
            .setName("Mermaid image scale")
            .setDesc("Scale factor for exported images (1x–4x). 2x recommended for retina displays.")
            .addSlider(slider =>
                slider
                    .setLimits(1, 4, 1)
                    .setValue(this.plugin.settings.mermaidScale)
                    .setDynamicTooltip()
                    .onChange(value => this.plugin.settings.mermaidScale = value)
            );

        new Setting(containerEl)
            .setName("Mermaid theme")
            .setDesc("Color theme for rendered diagrams.")
            .addDropdown(dd => {
                const themes: Record<string, string> = {
                    "default": "Default",
                    "dark": "Dark",
                    "forest": "Forest",
                    "neutral": "Neutral",
                    "base": "Base",
                };
                Object.entries(themes).forEach(([value, label]) => { dd.addOption(value, label); });
                dd.setValue(this.plugin.settings.mermaidTheme);
                dd.onChange(value => this.plugin.settings.mermaidTheme = value);
            });

        // ── Image Store ──
        new Setting(containerEl).setName("Image store").setHeading();

        const imageStoreTypeDiv = containerEl.createDiv();
        this.imageStoreDiv = containerEl.createDiv();

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
        void this.drawImageStoreSettings(this.imageStoreDiv);
    }

    hide(): void {
        void this.plugin.saveSettings().then(() => {
            this.plugin.setupImageUploader();
        }).catch(err => {
            console.error("Image upload toolkit: saveSettings failed", err);
        });
    }

    private async drawImageStoreSettings(parentEL: HTMLDivElement) {
        parentEL.empty();
        switch (ImageStore.normalizeId(this.plugin.settings.imageStore)) {
            case ImageStore.IMGUR.id:
                this.drawImgurSetting(parentEL);
                break;
            case ImageStore.GYAZO.id:
                this.drawGyazoSetting(parentEL);
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
            case ImageStore.BACKBLAZE_B2.id:
                this.drawB2Setting(parentEL);
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
                    .setPlaceholder("Enter client ID")
                    .setValue(this.plugin.settings.imgurAnonymousSetting.clientId)
                    .onChange(value => this.plugin.settings.imgurAnonymousSetting.clientId = value)
            )
    }

    private static clientIdSettingDescription() {
        const url = "https://api.imgur.com/oauth2/addclient";
        return createFragment(frag => {
            frag.append("Generate your own Client ID at ");
            frag.createEl("a", { text: url, href: url });
        });
    }

    private drawGyazoSetting(parentEL: HTMLDivElement) {
        new Setting(parentEL)
            .setName("Access token")
            .setDesc(PublishSettingTab.gyazoTokenSettingDescription())
            .addText(text =>
                text
                    .setPlaceholder("Enter access token")
                    .setValue(this.plugin.settings.gyazoSetting.accessToken)
                    .onChange(value => this.plugin.settings.gyazoSetting.accessToken = value)
            );

        new Setting(parentEL)
            .setName("Access policy")
            .setDesc("Set image visibility. Choose 'Only me' only if you do not need other people or external sites to access the uploaded image URL.")
            .addDropdown(dropdown =>
                dropdown
                    .addOption("anyone", "Anyone")
                    .addOption("only_me", "Only me")
                    .setValue(this.plugin.settings.gyazoSetting.accessPolicy)
                    .onChange((value: "anyone" | "only_me") => this.plugin.settings.gyazoSetting.accessPolicy = value)
            );

        new Setting(parentEL)
            .setName("Common description")
            .setDesc("A fixed Gyazo description applied to every upload. Leave empty to skip the description field.")
            .addText(text =>
                text
                    .setPlaceholder("Enter a shared description (optional)")
                    .setValue(this.plugin.settings.gyazoSetting.desc)
                    .onChange(value => this.plugin.settings.gyazoSetting.desc = value)
            );
    }

    private static gyazoTokenSettingDescription() {
        const url = "https://gyazo.com/oauth/applications";
        return createFragment(frag => {
            frag.append("Create an application and issue an access token at ");
            frag.createEl("a", { text: url, href: url });
        });
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
            .setName("Access key ID")
            .setDesc("The access key ID of Aliyun RAM.")
            .addText(text =>
                text
                    .setPlaceholder("Enter access key ID")
                    .setValue(this.plugin.settings.ossSetting.accessKeyId)
                    .onChange(value => this.plugin.settings.ossSetting.accessKeyId = value))
        new Setting(parentEL)
            .setName("Access key secret")
            .setDesc("The access key secret of Aliyun RAM.")
            .addText(text =>
                text
                    .setPlaceholder("Enter access key secret")
                    .setValue(this.plugin.settings.ossSetting.accessKeySecret)
                    .onChange(value => this.plugin.settings.ossSetting.accessKeySecret = value))
        new Setting(parentEL)
            .setName("Bucket name")
            .setDesc("The name of the bucket to store images.")
            .addText(text =>
                text
                    .setPlaceholder("Enter bucket name")
                    .setValue(this.plugin.settings.ossSetting.bucket)
                    .onChange(value => this.plugin.settings.ossSetting.bucket = value))

        new Setting(parentEL)
            .setName("Target path")
            .setDesc("The path to store images. Supports {year} {mon} {day} {random} {filename} vars. For example, /{year}/{mon}/{day}/{filename} with uploading pic.jpg stores it as /2023/06/08/pic.jpg.")
            .addText(text =>
                text
                    .setPlaceholder("Enter path")
                    .setValue(this.plugin.settings.ossSetting.path)
                    .onChange(value => this.plugin.settings.ossSetting.path = value))

        //custom domain
        new Setting(parentEL)
            .setName("Custom domain name")
            .setDesc("If the custom domain name is example.com, you can use https://example.com/pic.jpg to access pic.img.")
            .addText(text =>
                text
                    .setPlaceholder("Enter path")
                    .setValue(this.plugin.settings.ossSetting.customDomainName)
                    .onChange(value => this.plugin.settings.ossSetting.customDomainName = value))
    }

    private drawImageKitSetting(parentEL: HTMLDivElement) {
        new Setting(parentEL)
            .setName("ImageKit ID")
            .setDesc(PublishSettingTab.imagekitSettingDescription())
            .addText(text =>
                text
                    .setPlaceholder("Enter your ImageKit ID")
                    .setValue(this.plugin.settings.imagekitSetting.imagekitID)
                    .onChange(value => {
                        this.plugin.settings.imagekitSetting.imagekitID = value
                        this.plugin.settings.imagekitSetting.endpoint = `https://ik.imagekit.io/${value}/`
                    }))

        new Setting(parentEL)
            .setName("Folder name")
            .setDesc("The directory name. Leave blank to upload to the root folder.")
            .addText(text =>
                text
                    .setPlaceholder("Enter the folder name")
                    .setValue(this.plugin.settings.imagekitSetting.folder)
                    .onChange(value => this.plugin.settings.imagekitSetting.folder = value))

        new Setting(parentEL)
            .setName("Public key")
            .addText(text =>
                text
                    .setPlaceholder("Enter your public key")
                    .setValue(this.plugin.settings.imagekitSetting.publicKey)
                    .onChange(value => this.plugin.settings.imagekitSetting.publicKey = value))

        new Setting(parentEL)
            .setName("Private key")
            .addText(text =>
                text
                    .setPlaceholder("Enter your private key")
                    .setValue(this.plugin.settings.imagekitSetting.privateKey)
                    .onChange(value => this.plugin.settings.imagekitSetting.privateKey = value))
    }

    private static imagekitSettingDescription() {
        const url = "https://imagekit.io/dashboard/developer/api-keys";
        return createFragment(frag => {
            frag.append("Obtain id and keys from ");
            frag.createEl("a", { text: url, href: url });
        });
    }

    private drawAwsS3Setting(parentEL: HTMLDivElement) {
        // Add AWS S3 configuration section
        new Setting(parentEL)
            .setName('AWS S3 access key ID')
            .setDesc('Your AWS S3 access key ID.')
            .addText(text => text
                .setPlaceholder('Enter your access key ID')
                .setValue(this.plugin.settings.awsS3Setting?.accessKeyId || '')
                .onChange(value => this.plugin.settings.awsS3Setting.accessKeyId = value
                ));

        new Setting(parentEL)
            .setName('AWS S3 secret access key')
            .setDesc('Your AWS S3 secret access key.')
            .addText(text => text
                .setPlaceholder('Enter your secret access key')
                .setValue(this.plugin.settings.awsS3Setting?.secretAccessKey || '')
                .onChange(value => this.plugin.settings.awsS3Setting.secretAccessKey = value));

        new Setting(parentEL)
            .setName('AWS S3 region')
            .setDesc('Your AWS S3 region.')
            .addText(text => text
                .setPlaceholder('Enter your region')
                .setValue(this.plugin.settings.awsS3Setting?.region || '')
                .onChange(value => this.plugin.settings.awsS3Setting.region = value));

        new Setting(parentEL)
            .setName('AWS S3 bucket name')
            .setDesc('Your AWS S3 bucket name.')
            .addText(text => text
                .setPlaceholder('Enter your bucket name')
                .setValue(this.plugin.settings.awsS3Setting?.bucketName || '')
                .onChange(value => this.plugin.settings.awsS3Setting.bucketName = value));
        new Setting(parentEL)
            .setName("Target path")
            .setDesc("The path to store images. Supports {year} {mon} {day} {random} {filename} vars. For example, /{year}/{mon}/{day}/{filename} with uploading pic.jpg stores it as /2023/06/08/pic.jpg.")
            .addText(text =>
                text
                    .setPlaceholder("Enter path")
                    .setValue(this.plugin.settings.awsS3Setting.path)
                    .onChange(value => this.plugin.settings.awsS3Setting.path = value))

        //custom domain
        new Setting(parentEL)
            .setName("Custom domain name")
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
            .setName("Secret ID")
            .setDesc("The secret ID of Tencent Cloud.")
            .addText(text =>
                text
                    .setPlaceholder("Enter secret ID")
                    .setValue(this.plugin.settings.cosSetting.secretId)
                    .onChange(value => this.plugin.settings.cosSetting.secretId = value))
        new Setting(parentEL)
            .setName("Secret key")
            .setDesc("The secret key of Tencent Cloud.")
            .addText(text =>
                text
                    .setPlaceholder("Enter secret key")
                    .setValue(this.plugin.settings.cosSetting.secretKey)
                    .onChange(value => this.plugin.settings.cosSetting.secretKey = value))
        new Setting(parentEL)
            .setName("Bucket name")
            .setDesc("The name of the bucket to store images.")
            .addText(text =>
                text
                    .setPlaceholder("Enter bucket name")
                    .setValue(this.plugin.settings.cosSetting.bucket)
                    .onChange(value => this.plugin.settings.cosSetting.bucket = value))

        new Setting(parentEL)
            .setName("Target path")
            .setDesc("The path to store images. Supports {year} {mon} {day} {random} {filename} vars. For example, /{year}/{mon}/{day}/{filename} with uploading pic.jpg stores it as /2023/06/08/pic.jpg.")
            .addText(text =>
                text
                    .setPlaceholder("Enter path")
                    .setValue(this.plugin.settings.cosSetting.path)
                    .onChange(value => this.plugin.settings.cosSetting.path = value))

        //custom domain
        new Setting(parentEL)
            .setName("Custom domain name")
            .setDesc("If the custom domain name is example.com, you can use https://example.com/pic.jpg to access pic.img.")
            .addText(text =>
                text
                    .setPlaceholder("Enter path")
                    .setValue(this.plugin.settings.cosSetting.customDomainName)
                    .onChange(value => this.plugin.settings.cosSetting.customDomainName = value))
    }

    private drawQiniuSetting(parentEL: HTMLDivElement) {
        new Setting(parentEL)
            .setName("Access key")
            .setDesc("The access key of Qiniu.")
            .addText(text =>
                text
                    .setPlaceholder("Enter access key")
                    .setValue(this.plugin.settings.kodoSetting.accessKey)
                    .onChange(value => this.plugin.settings.kodoSetting.accessKey = value))
        new Setting(parentEL)
            .setName("Secret key")
            .setDesc("The secret key of Qiniu.")
            .addText(text =>
                text
                    .setPlaceholder("Enter secret key")
                    .setValue(this.plugin.settings.kodoSetting.secretKey)
                    .onChange(value => this.plugin.settings.kodoSetting.secretKey = value))
        new Setting(parentEL)
            .setName("Bucket name")
            .setDesc("The name of the bucket to store images.")
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
            .setName("Custom domain name")
            .setDesc("If the custom domain name is example.com, you can use https://example.com/pic.jpg to access pic.img.")
            .addText(text =>
                text
                    .setPlaceholder("Enter path")
                    .setValue(this.plugin.settings.kodoSetting.customDomainName)
                    .onChange(value => this.plugin.settings.kodoSetting.customDomainName = value))
    }

    private drawGitHubSetting(parentEL: HTMLDivElement) {
        new Setting(parentEL)
            .setName("Repository name")
            .setDesc("The name of the GitHub repository to store images (format: owner/repo).")
            .addText(text =>
                text
                    .setPlaceholder("Enter repository name (e.g., username/repo)")
                    .setValue(this.plugin.settings.githubSetting.repositoryName)
                    .onChange(value => this.plugin.settings.githubSetting.repositoryName = value)
            );

        new Setting(parentEL)
            .setName("Branch name")
            .setDesc("The branch to store images in (defaults to 'main').")
            .addText(text =>
                text
                    .setPlaceholder("Enter branch name")
                    .setValue(this.plugin.settings.githubSetting.branchName)
                    .onChange(value => this.plugin.settings.githubSetting.branchName = value)
            );

        new Setting(parentEL)
            .setName("Personal access token")
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
        const url = "https://github.com/settings/tokens";
        return createFragment(frag => {
            frag.append("Generate a personal access token with 'repo' scope at ");
            frag.createEl("a", { text: url, href: url });
        });
    }

    private drawR2Setting(parentEL: HTMLDivElement) {
        new Setting(parentEL)
            .setName('Cloudflare R2 access key ID')
            .setDesc('Your Cloudflare R2 access key ID.')
            .addText(text => text
                .setPlaceholder('Enter your access key ID')
                .setValue(this.plugin.settings.r2Setting?.accessKeyId || '')
                .onChange(value => this.plugin.settings.r2Setting.accessKeyId = value
                ));

        new Setting(parentEL)
            .setName('Cloudflare R2 secret access key')
            .setDesc('Your Cloudflare R2 secret access key.')
            .addText(text => text
                .setPlaceholder('Enter your secret access key')
                .setValue(this.plugin.settings.r2Setting?.secretAccessKey || '')
                .onChange(value => this.plugin.settings.r2Setting.secretAccessKey = value));

        new Setting(parentEL)
            .setName('Cloudflare R2 endpoint')
            .setDesc('Your Cloudflare R2 endpoint URL (e.g., https://account-id.r2.cloudflarestorage.com).')
            .addText(text => text
                .setPlaceholder('Enter your R2 endpoint')
                .setValue(this.plugin.settings.r2Setting?.endpoint || '')
                .onChange(value => this.plugin.settings.r2Setting.endpoint = value));

        new Setting(parentEL)
            .setName('Cloudflare R2 bucket name')
            .setDesc('Your Cloudflare R2 bucket name.')
            .addText(text => text
                .setPlaceholder('Enter your bucket name')
                .setValue(this.plugin.settings.r2Setting?.bucketName || '')
                .onChange(value => this.plugin.settings.r2Setting.bucketName = value));

        new Setting(parentEL)
            .setName("Target path")
            .setDesc("The path to store images. Supports {year} {mon} {day} {random} {filename} vars. For example, /{year}/{mon}/{day}/{filename} with uploading pic.jpg stores it as /2023/06/08/pic.jpg.")
            .addText(text =>
                text
                    .setPlaceholder("Enter path")
                    .setValue(this.plugin.settings.r2Setting.path)
                    .onChange(value => this.plugin.settings.r2Setting.path = value));

        //custom domain
        new Setting(parentEL)
            .setName("R2.dev URL or custom domain name")
            .setDesc("You can use the R2.dev URL such as https://pub-xxxx.r2.dev, or a custom domain. If the custom domain name is example.com, you can use https://example.com/pic.jpg to access pic.img.")
            .addText(text =>
                text
                    .setPlaceholder("Enter domain name")
                    .setValue(this.plugin.settings.r2Setting.customDomainName)
                    .onChange(value => this.plugin.settings.r2Setting.customDomainName = value));
    }

    private drawB2Setting(parentEL: HTMLDivElement) {
        new Setting(parentEL)
            .setName('Backblaze B2 access key ID')
            .setDesc('Your Backblaze B2 application key ID.')
            .addText(text => text
                .setPlaceholder('Enter your application key ID')
                .setValue(this.plugin.settings.b2Setting?.accessKeyId || '')
                .onChange(value => this.plugin.settings.b2Setting.accessKeyId = value
                ));

        new Setting(parentEL)
            .setName('Backblaze B2 secret access key')
            .setDesc('Your Backblaze B2 application key.')
            .addText(text => text
                .setPlaceholder('Enter your application key')
                .setValue(this.plugin.settings.b2Setting?.secretAccessKey || '')
                .onChange(value => this.plugin.settings.b2Setting.secretAccessKey = value));

        new Setting(parentEL)
            .setName('Backblaze B2 region')
            .setDesc('Your Backblaze B2 region (e.g., us-west-004).')
            .addText(text => text
                .setPlaceholder('Enter your region')
                .setValue(this.plugin.settings.b2Setting?.region || '')
                .onChange(value => this.plugin.settings.b2Setting.region = value));

        new Setting(parentEL)
            .setName('Backblaze B2 bucket name')
            .setDesc('Your Backblaze B2 bucket name.')
            .addText(text => text
                .setPlaceholder('Enter your bucket name')
                .setValue(this.plugin.settings.b2Setting?.bucketName || '')
                .onChange(value => this.plugin.settings.b2Setting.bucketName = value));

        new Setting(parentEL)
            .setName("Target path")
            .setDesc("The path to store images. Supports {year} {mon} {day} {random} {filename} vars. For example, /{year}/{mon}/{day}/{filename} with uploading pic.jpg stores it as /2023/06/08/pic.jpg.")
            .addText(text =>
                text
                    .setPlaceholder("Enter path")
                    .setValue(this.plugin.settings.b2Setting.path)
                    .onChange(value => this.plugin.settings.b2Setting.path = value));

        //custom domain
        new Setting(parentEL)
            .setName("Custom domain name")
            .setDesc("If you have configured a custom domain, you can use https://example.com/pic.jpg to access pic.img. Otherwise, leave it empty to use the default B2 URL.")
            .addText(text =>
                text
                    .setPlaceholder("Enter custom domain (optional)")
                    .setValue(this.plugin.settings.b2Setting.customDomainName)
                    .onChange(value => this.plugin.settings.b2Setting.customDomainName = value));
    }
}
