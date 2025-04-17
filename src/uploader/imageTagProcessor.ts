import {App, Editor, FileSystemAdapter, MarkdownView, normalizePath, Notice,} from "obsidian";
import path from "path";
import ImageUploader from "./imageUploader";
import {PublishSettings} from "../publish";

const MD_REGEX = /\!\[(.*)\]\((.*?\.(png|jpg|jpeg|gif|svg|webp|excalidraw))\)/g;
const WIKI_REGEX = /\!\[\[(.*?\.(png|jpg|jpeg|gif|svg|webp|excalidraw))(|.*)?\]\]/g;
const PROPERTIES_REGEX = /^---[\s\S]+?---\n/;

interface Image {
    name: string;
    path: string;
    url: string;
    source: string;
}

export const ACTION_PUBLISH: string = "PUBLISH";

export default class ImageTagProcessor {
    private app: App;
    private readonly imageUploader: ImageUploader;
    private settings: PublishSettings;
    private adapter: FileSystemAdapter;

    constructor(app: App, settings: PublishSettings, imageUploader: ImageUploader) {
        this.app = app;
        this.adapter = this.app.vault.adapter as FileSystemAdapter;
        this.settings = settings;
        this.imageUploader = imageUploader;
    }

    public async process(action: string): Promise<void> {
        let value = this.getValue();
        const basePath = this.adapter.getBasePath();
        const promises: Promise<Image>[] = []
        const images = this.getImageLists(value);
        const uploader = this.imageUploader;
        for (const image of images) {
            if (this.app.vault.getAbstractFileByPath(normalizePath(image.path)) == null) {
                new Notice(`Can NOT locate ${image.name} with ${image.path}, please check image path or attachment option in plugin setting!`, 10000);
                console.log(`${normalizePath(image.path)} not exist`);
                break;
            }
            const buf = await this.adapter.readBinary(image.path);
            promises.push(new Promise(function (resolve) {
                uploader.upload(new File([buf], image.name), basePath + '/' + image.path).then(imgUrl => {
                    image.url = imgUrl;
                    resolve(image)
                }).catch(e => {
                    new Notice(`Upload ${image.path} failed, remote server returned an error: ${e.error || e.message || e}`, 10000)
                })
            }));
        }

        return promises.length >= 0 && Promise.all(promises).then(images => {
            let altText;
            for (const image of images) {
                altText = this.settings.imageAltText ? path.parse(image.name)?.name?.replaceAll("-", " ")?.replaceAll("_", " ") : '';
                value = value.replaceAll(image.source, `![${altText}](${image.url})`);
            }
            if (this.settings.replaceOriginalDoc) {
                this.getEditor()?.setValue(value);
            }
            if (this.settings.ignoreProperties) {
                value = value.replace(PROPERTIES_REGEX, '');
            }
            switch (action) {
                case ACTION_PUBLISH:
                    navigator.clipboard.writeText(value);
                    new Notice("Copied to clipboard");
                    break;
                // more cases
                default:
                    throw new Error("invalid action!")
            }
        })
    }

    private getImageLists(value: string): Image[] {
        const images: Image[] = [];
        const wikiMatches = value.matchAll(WIKI_REGEX);
        const mdMatches = value.matchAll(MD_REGEX);
        for (const match of wikiMatches) {
            let {resolvedPath, name} = this.resolveImagePath(match[1])
            images.push({
                name: name,
                path: resolvedPath,
                source: match[0],
                url: '',
            })
        }
        for (const match of mdMatches) {
            if (match[2].startsWith('http://') || match[2].startsWith('https://')) {
                continue
            }
            let decodedName = decodeURI(match[2]);
            let {resolvedPath, name} = this.resolveImagePath(decodedName)
            images.push({
                name: name,
                path: resolvedPath,
                source: match[0],
                url: '',
            })
        }
        return images;
    }

    private resolveImagePath(imageName: string): {resolvedPath, name: string} {
        var pathName = imageName
        if (imageName.endsWith('.excalidraw')) {
            pathName = imageName + '.png'
        }
        var imagePath = path.join(this.settings.attachmentLocation, pathName);
        if (this.app.vault.getAbstractFileByPath(normalizePath(imagePath)) != null) {
            return {resolvedPath: imagePath, name: pathName}
        }
        if (pathName.startsWith('./')) {
            pathName = pathName.substring(2);
        }
        const parentPath = this.app.workspace.getActiveFile().parent.path;
        return {resolvedPath: path.join(parentPath, pathName), name: pathName};
    }


    private getValue(): string {
        const editor = this.getEditor();
        if (editor) {
            return editor.getValue()
        } else {
            return ""
        }
    }

    private getEditor(): Editor {
        const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (activeView) {
            return activeView.editor
        } else {
            return null
        }
    }
}