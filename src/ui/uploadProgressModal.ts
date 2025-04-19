import {Modal, setIcon} from "obsidian";

export default class UploadProgressModal extends Modal {
    private totalImages: number = 0;
    private completedImages: number = 0;
    private progressBarEl: HTMLElement;
    private progressTextEl: HTMLElement;
    private imageListEl: HTMLElement;
    private statusEl: HTMLElement;
    private imageStatus: Map<string, boolean> = new Map();
    
    constructor(app) {
        super(app);
        this.titleEl.setText("Uploading Images");
    }
    
    /**
     * Initialize the modal with the total number of images to upload
     * @param images Array of image objects or total count of images
     */
    public initialize(images: any[] | number): void {
        if (typeof images === 'number') {
            this.totalImages = images;
        } else {
            this.totalImages = images.length;
            // Initialize image status map
            images.forEach(img => {
                if (img.name) {
                    this.imageStatus.set(img.name, false);
                }
            });
        }
        
        this.completedImages = 0;
        this.modalEl.classList.add("upload-progress-modal");
        
        // Main content container
        const contentEl = this.contentEl.createDiv({cls: "upload-progress-content"});
        
        // Progress section
        const progressSection = contentEl.createDiv({cls: "progress-section"});
        
        // Status indicator (uploading/complete)
        this.statusEl = progressSection.createDiv({cls: "status-indicator"});
        const statusIconContainer = this.statusEl.createSpan({cls: "status-icon"});
        setIcon(statusIconContainer, "upload-cloud");
        this.statusEl.createSpan({text: "Uploading...", cls: "status-text"});
        
        // Progress bar container
        const progressBarContainer = progressSection.createDiv({cls: "progress-bar-container"});
        this.progressBarEl = progressBarContainer.createDiv({cls: "progress-bar"});
        
        // Progress text (e.g., "3/10 (30%)")
        this.progressTextEl = progressSection.createDiv({cls: "progress-text"});
        this.updateProgressText();
        
        // Image list (if we have image names)
        if (this.imageStatus.size > 0) {
            const imageListContainer = contentEl.createDiv({cls: "image-list-container"});
            imageListContainer.createEl("h3", {text: "Images"});
            this.imageListEl = imageListContainer.createDiv({cls: "image-list"});
            this.renderImageList();
        }
        
        // Style the modal
        this.addStyles();
    }
    
    /**
     * Update progress for a specific image or increment the overall progress
     * @param imageName Optional image name
     * @param success Whether the upload was successful
     */
    public updateProgress(imageName?: string, success: boolean = true): void {
        if (imageName && this.imageStatus.has(imageName)) {
            this.imageStatus.set(imageName, success);
        }
        
        this.completedImages++;
        
        // Update progress bar
        const percent = this.totalImages > 0 ? (this.completedImages / this.totalImages) * 100 : 0;
        this.progressBarEl.style.width = `${percent}%`;
        
        // Update progress text
        this.updateProgressText();
        
        // Update image list if we have it
        if (this.imageListEl && imageName) {
            this.renderImageList();
        }
        
        // If complete, update the status indicator
        if (this.completedImages >= this.totalImages) {
            this.statusEl.empty();
            const statusIconContainer = this.statusEl.createSpan({cls: "status-icon"});
            setIcon(statusIconContainer, "check");
            this.statusEl.createSpan({text: "Complete", cls: "status-text"});
            
            // Auto-close after 3 seconds
            setTimeout(() => {
                this.close();
            }, 3000);
        }
    }
    
    /**
     * Update the progress text display
     */
    private updateProgressText(): void {
        const percent = this.totalImages > 0 ? Math.round((this.completedImages / this.totalImages) * 100) : 0;
        this.progressTextEl.setText(`${this.completedImages}/${this.totalImages} (${percent}%)`);
    }
    
    /**
     * Render the list of images with their status
     */
    private renderImageList(): void {
        if (!this.imageListEl) return;
        
        this.imageListEl.empty();
        
        for (const [name, status] of this.imageStatus.entries()) {
            const itemEl = this.imageListEl.createDiv({cls: "image-item"});
            
            // Status icon
            const iconContainer = itemEl.createSpan({cls: "image-status-icon"});
            if (status) {
                setIcon(iconContainer, "check-circle");
                iconContainer.classList.add("success");
            } else {
                setIcon(iconContainer, "circle");
                iconContainer.classList.add("pending");
            }
            
            // Image name
            itemEl.createSpan({text: name, cls: "image-name"});
        }
    }
    
    /**
     * Add custom styles to the modal
     */
    private addStyles(): void {
        // Add custom styles to the progress bar
        this.progressBarEl.style.width = "0%";
        this.progressBarEl.style.height = "8px";
        this.progressBarEl.style.backgroundColor = "var(--interactive-accent)";
        this.progressBarEl.style.borderRadius = "4px";
        this.progressBarEl.style.transition = "width 0.3s ease-in-out";
        
        const modalContent = this.contentEl;
        
        // Progress bar container styling
        const progressBarContainer = modalContent.querySelector(".progress-bar-container");
        if (progressBarContainer instanceof HTMLElement) {
            progressBarContainer.style.width = "100%";
            progressBarContainer.style.height = "8px";
            progressBarContainer.style.backgroundColor = "var(--background-modifier-border)";
            progressBarContainer.style.borderRadius = "4px";
            progressBarContainer.style.marginBottom = "10px";
        }
        
        // Progress section styling
        const progressSection = modalContent.querySelector(".progress-section");
        if (progressSection instanceof HTMLElement) {
            progressSection.style.marginBottom = "20px";
            progressSection.style.textAlign = "center";
        }
        
        // Image list styling
        const imageList = modalContent.querySelector(".image-list");
        if (imageList instanceof HTMLElement) {
            imageList.style.maxHeight = "200px";
            imageList.style.overflowY = "auto";
            imageList.style.border = "1px solid var(--background-modifier-border)";
            imageList.style.borderRadius = "4px";
            imageList.style.padding = "8px";
        }
    }
}