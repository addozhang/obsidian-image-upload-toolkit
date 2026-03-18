import mermaid from "mermaid";
import ImageUploader from "./imageUploader";

const MERMAID_REGEX = /```mermaid\n([\s\S]*?)```/g;

export default class MermaidProcessor {
    private uploader: ImageUploader;

    constructor(uploader: ImageUploader) {
        this.uploader = uploader;
        mermaid.initialize({ startOnLoad: false, theme: "default" });
    }

    async process(value: string): Promise<string> {
        const matches = [...value.matchAll(MERMAID_REGEX)];
        if (matches.length === 0) return value;

        for (let i = 0; i < matches.length; i++) {
            const match = matches[i];
            const code = match[1].trim();
            const id = `mermaid-export-${Date.now()}-${i}`;
            try {
                const { svg } = await mermaid.render(id, code);
                const pngBlob = await this.svgToPng(svg);
                const file = new File([pngBlob], `${id}.png`, { type: "image/png" });
                const url = await this.uploader.upload(file, `${id}.png`);
                value = value.replace(match[0], `![mermaid](${url})`);
            } catch (e) {
                console.warn(`MermaidProcessor: failed to render block ${i}`, e);
                // Clean up error elements mermaid injects into the DOM on failure
                document.querySelector(`#d${id}`)?.remove();
            }
        }
        return value;
    }

    private svgToPng(svgString: string): Promise<Blob> {
        return new Promise((resolve, reject) => {
            const {width, height} = this.parseSvgDimensions(svgString);

            const img = new Image();
            img.onload = () => {
                const canvasWidth = img.naturalWidth || width;
                const canvasHeight = img.naturalHeight || height;
                const canvas = document.createElement("canvas");
                canvas.width = canvasWidth;
                canvas.height = canvasHeight;
                const ctx = canvas.getContext("2d")!;
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(0, 0, canvasWidth, canvasHeight);
                ctx.drawImage(img, 0, 0);
                canvas.toBlob((blob) => {
                    if (blob) resolve(blob);
                    else reject(new Error("canvas.toBlob returned null"));
                }, "image/png");
            };
            img.onerror = (e) => {
                reject(e);
            };
            // Use encodeURIComponent for Unicode safety (mermaid labels may contain non-ASCII)
            img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
        });
    }

    private parseSvgDimensions(svg: string): { width: number; height: number } {
        // Use DOMParser for robust SVG dimension extraction
        try {
            const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
            const el = doc.querySelector("svg");
            if (el) {
                const viewBox = el.getAttribute("viewBox")?.split(" ").map(Number);
                if (viewBox?.length === 4) {
                    return { width: viewBox[2], height: viewBox[3] };
                }
                const w = parseFloat(el.getAttribute("width") || "0");
                const h = parseFloat(el.getAttribute("height") || "0");
                if (w > 0 && h > 0) {
                    return { width: w, height: h };
                }
            }
        } catch (e) {
            // Fall through to defaults
        }

        return { width: 1200, height: 800 };
    }
}
