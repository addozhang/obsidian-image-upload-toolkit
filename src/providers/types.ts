import type ObsidianPublish from "../publish";
import type ImageStore from "../imageStore";
import type ImageUploader from "../uploader/imageUploader";

/**
 * Single registration point for a storage provider: its ImageStore entry,
 * uploader construction, hosted-URL detection and settings UI all live in
 * one descriptor instead of being spread across parallel switches.
 */
export interface ProviderDescriptor {
    store: ImageStore;
    /** Build the uploader for this provider from the current settings. */
    build: (settings: ObsidianPublish["settings"]) => ImageUploader;
    /** Whether the URL already points at this provider (skips re-upload). */
    isHosted: (url: string, settings: ObsidianPublish["settings"]) => boolean;
    /** Render the provider-specific section of the settings tab. */
    drawSettings: (parentEl: HTMLElement, plugin: ObsidianPublish) => void;
}
