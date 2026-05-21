import {App, Modal, setIcon} from "obsidian";

interface NamedImage {
    name?: string;
}

type UploadStatus = "pending" | "success" | "failed";

export default class UploadProgressModal extends Modal {
    private totalImages: number = 0;
    private completedImages: number = 0;
    private successCount: number = 0;
    private failureCount: number = 0;
    private progressBarEl: HTMLElement;
    private progressTextEl: HTMLElement;
    private summaryEl: HTMLElement | null = null;
    private imageListEl: HTMLElement;
    private statusEl: HTMLElement;
    private imageStatus: Map<string, UploadStatus> = new Map();
    private autoCloseTimer: number | null = null;

    constructor(app: App) {
        super(app);
        this.titleEl.setText("Uploading images");
    }

    onClose(): void {
        if (this.autoCloseTimer !== null) {
            activeWindow.clearTimeout(this.autoCloseTimer);
            this.autoCloseTimer = null;
        }
        super.onClose?.();
    }
    
    /**
     * Initialize the modal with the total number of images to upload
     * @param images Array of image objects or total count of images
     */
    public initialize(images: NamedImage[] | number): void {
        if (typeof images === 'number') {
            this.totalImages = images;
        } else {
            this.totalImages = images.length;
            // Initialize image status map
            images.forEach(img => {
                if (img.name) {
                    this.imageStatus.set(img.name, "pending");
                }
            });
        }
        
        this.completedImages = 0;
        this.successCount = 0;
        this.failureCount = 0;
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
            imageListContainer.createDiv({cls: "image-list-heading", text: "Images"});
            this.imageListEl = imageListContainer.createDiv({cls: "image-list"});
            this.renderImageList();
        }
    }
    
    /**
     * Update progress for a specific image or increment the overall progress
     * @param imageName Optional image name
     * @param success Whether the upload was successful
     */
    public updateProgress(imageName?: string, success: boolean = true): void {
        if (imageName && this.imageStatus.has(imageName)) {
            this.imageStatus.set(imageName, success ? "success" : "failed");
        }

        this.completedImages++;
        if (success) {
            this.successCount++;
        } else {
            this.failureCount++;
        }

        // Update progress bar
        const percent = this.totalImages > 0 ? (this.completedImages / this.totalImages) * 100 : 0;
        this.progressBarEl.style.width = `${percent}%`;
        if (this.failureCount > 0) {
            this.progressBarEl.classList.add("has-failures");
        }

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
            if (this.failureCount === 0) {
                setIcon(statusIconContainer, "check");
                this.statusEl.createSpan({text: "Complete", cls: "status-text"});
                this.statusEl.classList.remove("has-failures");
                // Auto-close after 3 seconds only on full success
                this.autoCloseTimer = activeWindow.setTimeout(() => {
                    this.autoCloseTimer = null;
                    this.close();
                }, 3000);
            } else if (this.successCount === 0) {
                setIcon(statusIconContainer, "x-circle");
                this.statusEl.createSpan({text: "Failed", cls: "status-text"});
                this.statusEl.classList.add("has-failures");
            } else {
                setIcon(statusIconContainer, "alert-triangle");
                this.statusEl.createSpan({
                    text: `Completed with errors (${this.failureCount} failed)`,
                    cls: "status-text",
                });
                this.statusEl.classList.add("has-failures");
            }
            this.renderSummary();
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
     * Render or refresh the success/failure summary line shown once the run finishes.
     */
    private renderSummary(): void {
        if (!this.summaryEl) {
            this.summaryEl = this.progressTextEl.parentElement?.createDiv({cls: "progress-summary"}) ?? null;
        }
        if (!this.summaryEl) return;
        this.summaryEl.empty();
        const okSpan = this.summaryEl.createSpan({cls: "summary-success"});
        okSpan.setText(`${this.successCount} succeeded`);
        if (this.failureCount > 0) {
            this.summaryEl.createSpan({text: " · ", cls: "summary-sep"});
            const failSpan = this.summaryEl.createSpan({cls: "summary-failed"});
            failSpan.setText(`${this.failureCount} failed`);
        }
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
            if (status === "success") {
                setIcon(iconContainer, "check-circle");
                iconContainer.classList.add("success");
            } else if (status === "failed") {
                setIcon(iconContainer, "x-circle");
                iconContainer.classList.add("failed");
            } else {
                setIcon(iconContainer, "circle");
                iconContainer.classList.add("pending");
            }

            // Image name
            itemEl.createSpan({text: name, cls: "image-name"});
        }
    }
}