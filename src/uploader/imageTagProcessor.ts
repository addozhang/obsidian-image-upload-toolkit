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

// Return type for resolveImagePath method
interface ResolvedImagePath {
    resolvedPath: string;
    name: string;
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
        const promises: Promise<Image>[] = [];
        const images = this.getImageLists(value);
        const uploader = this.imageUploader;
        
        for (const image of images) {
            if (this.app.vault.getAbstractFileByPath(normalizePath(image.path)) == null) {
                new Notice(`Can NOT locate ${image.name} with ${image.path}, please check image path or attachment option in plugin setting!`, 10000);
                console.log(`${normalizePath(image.path)} not exist`);
                // Continue processing other images instead of breaking
                continue;
            }
            
            try {
                const buf = await this.adapter.readBinary(image.path);
                promises.push(new Promise<Image>((resolve, reject) => {
                    uploader.upload(new File([buf], image.name), basePath + '/' + image.path)
                        .then(imgUrl => {
                            image.url = imgUrl;
                            resolve(image);
                        })
                        .catch(e => {
                            const errorMessage = `Upload ${image.path} failed, remote server returned an error: ${e.error || e.message || e}`;
                            new Notice(errorMessage, 10000);
                            reject(new Error(errorMessage));
                        });
                }));
            } catch (error) {
                console.error(`Failed to read file: ${image.path}`, error);
                new Notice(`Failed to read file: ${image.path}`, 5000);
            }
        }

        if (promises.length === 0) {
            new Notice("No images found or all images failed to process", 3000);
            return;
        }

        return Promise.all(promises.map(p => p.catch(e => {
            console.error(e);
            return null; // Return null for failed promises to continue processing
        }))).then(results => {
            // Filter out null results from failed promises
            const successfulImages = results.filter(img => img !== null) as Image[];
            
            let altText;
            for (const image of successfulImages) {
                altText = this.settings.imageAltText ? 
                    path.parse(image.name)?.name?.replaceAll("-", " ")?.replaceAll("_", " ") : 
                    '';
                value = value.replaceAll(image.source, `![${altText}](${image.url})`);
            }
            
            if (this.settings.replaceOriginalDoc && this.getEditor()) {
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
                    throw new Error("invalid action!");
            }
        });
    }

    private getImageLists(value: string): Image[] {
        const images: Image[] = [];
        
        try {
            const wikiMatches = value.matchAll(WIKI_REGEX);
            for (const match of wikiMatches) {
                try {
                    const {resolvedPath, name} = this.resolveImagePath(match[1]);
                    images.push({
                        name,
                        path: resolvedPath,
                        source: match[0],
                        url: '',
                    });
                } catch (error) {
                    console.error(`Failed to process wiki image: ${match[0]}`, error);
                }
            }
            
            const mdMatches = value.matchAll(MD_REGEX);
            for (const match of mdMatches) {
                // Skip external images
                if (match[2].startsWith('http://') || match[2].startsWith('https://')) {
                    continue;
                }
                
                try {
                    const decodedName = decodeURI(match[2]);
                    const {resolvedPath, name} = this.resolveImagePath(decodedName);
                    images.push({
                        name,
                        path: resolvedPath,
                        source: match[0],
                        url: '',
                    });
                } catch (error) {
                    console.error(`Failed to process markdown image: ${match[0]}`, error);
                }
            }
        } catch (error) {
            console.error("Error processing image lists:", error);
        }
        
        return images;
    }

    private resolveImagePath(imageName: string): ResolvedImagePath {
        const pathName = imageName.endsWith('.excalidraw') ? 
            imageName + '.png' : 
            imageName;
            
        const imagePath = path.join(this.settings.attachmentLocation, pathName);
        if (this.app.vault.getAbstractFileByPath(normalizePath(imagePath)) != null) {
            return {resolvedPath: imagePath, name: pathName};
        }
        
        let finalPathName = pathName;
        if (pathName.startsWith('./')) {
            finalPathName = pathName.substring(2);
        }
        
        const activeFile = this.app.workspace.getActiveFile();
        if (!activeFile || !activeFile.parent) {
            throw new Error("No active file found");
        }
        
        const parentPath = activeFile.parent.path;
        return {resolvedPath: path.join(parentPath, finalPathName), name: finalPathName};
    }

    private getValue(): string {
        const editor = this.getEditor();
        return editor ? editor.getValue() : "";
    }

    private getEditor(): Editor | null {
        const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
        return activeView ? activeView.editor : null;
    }
}