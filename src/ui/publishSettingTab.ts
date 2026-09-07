import {App, PluginSettingTab, Setting} from "obsidian";
import ObsidianPublish from "../publish";
import ImageStore from "../imageStore";
import {getProvider} from "../providers/registry";

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
                dd.onChange((v) => {
                    this.plugin.settings.imageStore = v;
                    this.plugin.setupImageUploader();
                    this.drawImageStoreSettings(this.imageStoreDiv);
                });
            });
        this.drawImageStoreSettings(this.imageStoreDiv);
    }

    hide(): void {
        void this.plugin.saveSettings().then(() => {
            this.plugin.setupImageUploader();
        }).catch(err => {
            console.error("Image upload toolkit: saveSettings failed", err);
        });
    }

    private drawImageStoreSettings(parentEL: HTMLDivElement) {
        parentEL.empty();
        const storeId = ImageStore.normalizeId(this.plugin.settings.imageStore);
        const provider = getProvider(storeId);
        if (!provider) {
            throw new Error(`No provider registered for image store: ${storeId}`);
        }
        provider.drawSettings(parentEL, this.plugin);
    }
}
