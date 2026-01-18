import {requestUrl} from "obsidian";
import ApiError from "./apiError";

export interface WebImageDownloadResult {
    buffer: ArrayBuffer;
    filename: string;
    contentType?: string;
}

export class WebImageDownloader {
    /**
     * Download an image from a web URL
     * @param url The URL of the image to download
     * @returns Promise with the image buffer and metadata
     */
    static async download(url: string): Promise<WebImageDownloadResult> {
        try {
            // Use Obsidian's requestUrl which handles CORS and authentication better
            const response = await requestUrl({
                url: url,
                method: 'GET',
                headers: {
                    'User-Agent': 'Obsidian-Image-Upload-Toolkit'
                }
            });

            if (response.status !== 200) {
                throw new ApiError(`Failed to download image: HTTP ${response.status}`);
            }

            // Get content type from headers
            const contentType = response.headers['content-type'] || response.headers['Content-Type'];
            
            // Validate it's an image
            if (contentType && !contentType.startsWith('image/')) {
                throw new ApiError(`URL does not point to an image (Content-Type: ${contentType})`);
            }

            // Extract filename from URL or generate one
            const filename = this.extractFilename(url, contentType);

            return {
                buffer: response.arrayBuffer,
                filename: filename,
                contentType: contentType
            };
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError(`Failed to download image from ${url}: ${error.message || error}`);
        }
    }

    /**
     * Extract filename from URL or generate one based on content type
     */
    private static extractFilename(url: string, contentType?: string): string {
        try {
            // Parse URL to get pathname
            const urlObj = new URL(url);
            const pathname = urlObj.pathname;
            
            // Get the last segment of the path
            const segments = pathname.split('/').filter(s => s.length > 0);
            let filename = segments.length > 0 ? segments[segments.length - 1] : '';
            
            // If filename has an extension, use it
            if (filename && /\.(png|jpg|jpeg|gif|svg|webp)$/i.test(filename)) {
                return decodeURIComponent(filename);
            }
            
            // Otherwise, generate filename based on content type
            const extension = this.getExtensionFromContentType(contentType);
            const timestamp = Date.now();
            return `web-image-${timestamp}${extension}`;
        } catch (error) {
            // Fallback to timestamp-based name
            const extension = this.getExtensionFromContentType(contentType);
            return `web-image-${Date.now()}${extension}`;
        }
    }

    /**
     * Get file extension from content type
     */
    private static getExtensionFromContentType(contentType?: string): string {
        if (!contentType) return '.jpg';
        
        const typeMap: Record<string, string> = {
            'image/png': '.png',
            'image/jpeg': '.jpg',
            'image/jpg': '.jpg',
            'image/gif': '.gif',
            'image/svg+xml': '.svg',
            'image/webp': '.webp'
        };
        
        return typeMap[contentType.toLowerCase()] || '.jpg';
    }

    /**
     * Check if a URL is a web image (http/https)
     */
    static isWebImage(url: string): boolean {
        return url.startsWith('http://') || url.startsWith('https://');
    }
}