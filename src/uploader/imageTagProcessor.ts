import {App, Editor, FileSystemAdapter, MarkdownView, normalizePath, Notice} from "obsidian";
import path from "path";
import ImageUploader from "./imageUploader";
import {PublishSettings} from "../publish";
import UploadProgressModal from "../ui/uploadProgressModal";
import {WebImageDownloader} from "./webImageDownloader";

const MD_REGEX = /\!\[(.*)\]\((.*?\.(png|jpg|jpeg|gif|svg|webp|excalidraw))\)/g;
const WIKI_REGEX = /\!\[\[(.*?\.(png|jpg|jpeg|gif|svg|webp|excalidraw))(|.*)?\]\]/g;
const PROPERTIES_REGEX = /^---[\s\S]+?---\n/;

interface Image {
    name: string;
    path: string;
    url: string;
    source: string;
    isWebImage?: boolean; // Flag to indicate if this is a web image
}

// Return type for resolveImagePath method
interface ResolvedImagePath {
    resolvedPath: string;
    name: string;
}

export const ACTION_PUBLISH: string = "PUBLISH";

export default class ImageTagProcessor {
    private readonly app: App;
    private readonly imageUploader: ImageUploader;
    private settings: PublishSettings;
    private adapter: FileSystemAdapter;
    private progressModal: UploadProgressModal | null = null;
    private readonly useModal: boolean = true; // Set to true to use modal, false to use status bar

    constructor(app: App, settings: PublishSettings, imageUploader: ImageUploader, useModal: boolean = true) {
        this.app = app;
        this.adapter = this.app.vault.adapter as FileSystemAdapter;
        this.settings = settings;
        this.imageUploader = imageUploader;
        this.useModal = useModal;
    }

    public async process(action: string): Promise<void> {
        let value = this.getValue();
        const basePath = this.adapter.getBasePath();
        const promises: Promise<Image>[] = [];
        const images = this.getImageLists(value);
        const uploader = this.imageUploader;
        
        // Initialize progress display
        if (this.useModal && images.length > 0) {
            this.progressModal = new UploadProgressModal(this.app);
            this.progressModal.open();
            this.progressModal.initialize(images);
        }
        
        for (const image of images) {
            // Handle web images differently
            if (image.isWebImage) {
                promises.push(new Promise<Image>(async (resolve, reject) => {
                    try {
                        // Download the web image
                        const downloadResult = await WebImageDownloader.download(image.path);
                        const file = new File([downloadResult.buffer], downloadResult.filename);
                        
                        // Upload to cloud storage - use just the filename as fullPath for web images
                        // since they don't have a real file system path
                        const imgUrl = await uploader.upload(file, downloadResult.filename);
                        image.url = imgUrl;
                        
                        // Update progress on successful upload
                        if (this.progressModal) {
                            this.progressModal.updateProgress(image.name, true);
                        }
                        resolve(image);
                    } catch (e) {
                        // Update progress on failed upload
                        if (this.progressModal) {
                            this.progressModal.updateProgress(image.name, false);
                        }
                        const errorMessage = `Upload web image ${image.path} failed: ${e.error || e.message || e}`;
                        new Notice(errorMessage, 10000);
                        console.error('Web image upload error:', e);
                        reject(new Error(errorMessage));
                    }
                }));
                continue;
            }
            
            // Handle local images
            if (this.app.vault.getAbstractFileByPath(normalizePath(image.path)) == null) {
                new Notice(`Can NOT locate ${image.name} with ${image.path}, please check image path or attachment option in plugin setting!`, 10000);
                console.log(`${normalizePath(image.path)} not exist`);
                // Update the progress modal with the failure
                if (this.progressModal) {
                    this.progressModal.updateProgress(image.name, false);
                }
                continue; // Skip to the next image
            }
            
            try {
                const buf = await this.adapter.readBinary(image.path);
                promises.push(new Promise<Image>((resolve, reject) => {
                    uploader.upload(new File([buf], image.name), basePath + '/' + image.path)
                        .then(imgUrl => {
                            image.url = imgUrl;
                            // Update progress on successful upload
                            if (this.progressModal) {
                                this.progressModal.updateProgress(image.name, true);
                            }
                            resolve(image);
                        })
                        .catch(e => {
                            // Also update progress on failed upload
                            if (this.progressModal) {
                                this.progressModal.updateProgress(image.name, false);
                            }
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
            if (this.progressModal) {
                this.progressModal.close();
            }
            new Notice("No images found or all images failed to process", 3000);
            return;
        }

        return Promise.all(promises.map(p => p.catch(e => {
            console.error(e);
            return null; // Return null for failed promises to continue processing
        }))).then(results => {
            // Modal will auto-close when all uploads complete
            // Filter out null results from failed promises
            const successfulImages = results.filter(img => img !== null) as Image[];
            
            let altText;
            for (const image of successfulImages) {
                altText = this.settings.imageAltText ?
                    path.parse(image.name)?.name?.replaceAll("-", " ")?.replaceAll("_", " ") :
                    '';
                value = value.replaceAll(image.source, `![${altText}](${image.url})`);
            }
            
            // Update original document behavior:
            // - If replaceOriginalDoc is enabled: update everything (web + local images)
            // - If replaceOriginalDoc is disabled: only update web images (to prevent link rot)
            if (this.settings.replaceOriginalDoc) {
                // Replace all images (web + local)
                if (this.getEditor()) {
                    this.getEditor()?.setValue(value);
                }
            } else {
                // Only replace web images in the original document
                const webImages = successfulImages.filter(img => img.isWebImage);
                if (webImages.length > 0 && this.getEditor()) {
                    let docValue = this.getValue();
                    for (const image of webImages) {
                        altText = this.settings.imageAltText ?
                            path.parse(image.name)?.name?.replaceAll("-", " ")?.replaceAll("_", " ") :
                            '';
                        docValue = docValue.replaceAll(image.source, `![${altText}](${image.url})`);
                    }
                    this.getEditor()?.setValue(docValue);
                }
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
                this.processMatched(match[1], match[0], images);
            }
            
            const mdMatches = value.matchAll(MD_REGEX);
            for (const match of mdMatches) {
                const imageUrl = match[2];
                
                // Check if it's a web image and if upload web images is enabled
                if (WebImageDownloader.isWebImage(imageUrl)) {
                    if (this.settings.uploadWebImages && !this.isAlreadyHosted(imageUrl)) {
                        // Add as web image to be downloaded and uploaded
                        this.processWebImage(imageUrl, match[0], images);
                    }
                    // Skip if setting is disabled or already hosted
                    continue;
                }
                
                const decodedName = decodeURI(imageUrl);
                this.processMatched(decodedName, match[0], images);
            }
        } catch (error) {
            console.error("Error processing image lists:", error);
        }
        
        return images;
    }

    private processMatched(path: string, src: string, images: Image[]){    
        try {
            const {resolvedPath, name} = this.resolveImagePath(path);
            // check the item with same resolvedPath 
            const existingImage = images.find(image => image.path === resolvedPath);
            if (!existingImage) {
                images.push({
                    name,
                    path: resolvedPath,
                    source: src,
                    url: '',
                });
            }
        } catch (error) {
            console.error(`Failed to process image: ${src}`, error);
        }
    }

    /**
     * Process web image URL
     */
    private processWebImage(url: string, src: string, images: Image[]) {
        try {
            // Extract a friendly name from URL
            const urlObj = new URL(url);
            const pathname = urlObj.pathname;
            const segments = pathname.split('/').filter(s => s.length > 0);
            const name = segments.length > 0 ? segments[segments.length - 1] : `web-image-${Date.now()}`;
            
            // Check if already in list
            const existingImage = images.find(image => image.path === url);
            if (!existingImage) {
                images.push({
                    name: decodeURIComponent(name),
                    path: url, // Store the URL as path for web images
                    source: src,
                    url: '',
                    isWebImage: true
                });
            }
        } catch (error) {
            console.error(`Failed to process web image: ${url}`, error);
        }
    }

    /**
     * Check if URL is already hosted on the configured storage service
     */
    private isAlreadyHosted(url: string): boolean {
        try {
            const urlObj = new URL(url);
            const hostname = urlObj.hostname;
            
            // Check against common patterns for each storage service
            switch (this.settings.imageStore) {
                case 'imgur':
                    return hostname.includes('imgur.com') || hostname.includes('i.imgur.com');
                case 'github':
                    if (this.settings.githubSetting?.repositoryName) {
                        // Check if it's from the configured GitHub repo
                        return url.includes('github.com') &&
                               url.includes(this.settings.githubSetting.repositoryName);
                    }
                    return hostname.includes('github.com') || hostname.includes('githubusercontent.com');
                case 'oss':
                    if (this.settings.ossSetting?.customDomainName) {
                        return hostname.includes(this.settings.ossSetting.customDomainName);
                    }
                    return hostname.includes('aliyuncs.com');
                case 's3':
                    if (this.settings.awsS3Setting?.customDomainName) {
                        return hostname.includes(this.settings.awsS3Setting.customDomainName);
                    }
                    return hostname.includes('amazonaws.com') || hostname.includes('s3');
                case 'cos':
                    if (this.settings.cosSetting?.customDomainName) {
                        return hostname.includes(this.settings.cosSetting.customDomainName);
                    }
                    return hostname.includes('myqcloud.com');
                case 'qiniu':
                    if (this.settings.kodoSetting?.customDomainName) {
                        return hostname.includes(this.settings.kodoSetting.customDomainName);
                    }
                    return hostname.includes('qiniudn.com') || hostname.includes('clouddn.com');
                case 'imagekit':
                    return hostname.includes('imagekit.io');
                case 'r2':
                    if (this.settings.r2Setting?.customDomainName) {
                        return hostname.includes(this.settings.r2Setting.customDomainName);
                    }
                    return hostname.includes('r2.dev') || hostname.includes('r2.cloudflarestorage.com');
                default:
                    return false;
            }
        } catch (error) {
            // If URL parsing fails, assume not hosted
            return false;
        }
    }

    private resolveImagePath(imageName: string): ResolvedImagePath {
        let pathName = imageName.endsWith('.excalidraw') ?
            imageName + '.png' :
            imageName;

        if (pathName.indexOf('/') < 0) {
            // @ts-ignore: config is not defined in vault api, but available
            const attachmentFolderPath = this.app.vault.config.attachmentFolderPath;
            pathName = path.join(attachmentFolderPath, pathName);
            if (attachmentFolderPath.startsWith('.')) {
                pathName = './' + pathName;
            }
        } else {
            imageName = imageName.substring(pathName.lastIndexOf('/') + 1);
        }

        // Handle relative paths: ./, ../, or any path containing / but not starting with /
        if (pathName.startsWith('./') || pathName.startsWith('../') || (pathName.includes('/') && !pathName.startsWith('/'))) {
            const activeFile = this.app.workspace.getActiveFile();
            if (!activeFile || !activeFile.parent) {
                throw new Error("No active file found");
            }
            const parentPath = activeFile.parent.path;
            // Normalize the path to resolve ../ and ./
            const normalizedPath = path.normalize(path.join(parentPath, pathName));
            return {resolvedPath: normalizedPath, name: imageName};
        } else {
            return {resolvedPath: pathName, name: imageName};
        }
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