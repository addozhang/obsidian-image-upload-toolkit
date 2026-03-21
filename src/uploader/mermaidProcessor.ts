import {loadMermaid, Notice} from "obsidian";
import ImageUploader from "./imageUploader";

// Matches ```mermaid or ~~~mermaid fenced blocks, tolerates \r\n and trailing whitespace
export const MERMAID_REGEX = /(?:```|~~~)mermaid[^\S\r\n]*\r?\n([\s\S]*?)(?:```|~~~)/g;

// Marker prefix to identify mermaid-generated image URLs (prevents double-upload)
export const MERMAID_IMG_MARKER = "mermaid-export-";

export interface MermaidProcessResult {
    value: string;
    generatedUrls: Set<string>;
}

export const VALID_THEMES = ["default", "dark", "forest", "neutral", "base"];
const MAX_CANVAS_DIMENSION = 16384;

export default class MermaidProcessor {
    private uploader: ImageUploader;
    private mermaidInstance: any = null;
    private scale: number;
    private theme: string;

    constructor(uploader: ImageUploader, scale: number = 2, theme: string = "default") {
        this.uploader = uploader;
        this.scale = Math.max(1, Math.min(4, Math.round(scale)));
        this.theme = VALID_THEMES.includes(theme) ? theme : "default";
    }

    private async ensureMermaid(): Promise<any> {
        if (!this.mermaidInstance) {
            this.mermaidInstance = await loadMermaid();
            this.mermaidInstance.initialize({ startOnLoad: false, theme: this.theme });
        }
        return this.mermaidInstance;
    }

    async process(value: string): Promise<MermaidProcessResult> {
        const generatedUrls = new Set<string>();
        const matches = [...value.matchAll(MERMAID_REGEX)];
        if (matches.length === 0) return { value, generatedUrls };

        new Notice(`Rendering ${matches.length} mermaid diagram(s)...`);

        let mermaid;
        try {
            mermaid = await this.ensureMermaid();
        } catch (e) {
            const msg = `Mermaid initialization failed: ${e.message || e}`;
            console.error(`MermaidProcessor: ${msg}`);
            new Notice(msg, 8000);
            return { value, generatedUrls };
        }

        // Process blocks sequentially — mermaid.render() manipulates the DOM
        // and is not safe to call concurrently
        for (let i = 0; i < matches.length; i++) {
            const match = matches[i];
            const code = match[1].trim();
            const id = `${MERMAID_IMG_MARKER}${Date.now()}-${i}`;
            try {
                const { svg } = await mermaid.render(id, code);
                const pngBlob = await this.svgToPng(svg);
                const file = new File([pngBlob], `${id}.png`, { type: "image/png" });
                const url = await this.uploader.upload(file, `${id}.png`);
                generatedUrls.add(url);
                value = value.replace(match[0], `![mermaid](${url})`);
            } catch (e) {
                const msg = `Failed to render mermaid block ${i + 1}: ${e.message || e}`;
                console.warn(`MermaidProcessor: ${msg}`);
                new Notice(msg, 8000);
                value = value.replace(match[0], `<!-- mermaid render failed: block ${i + 1} -->`);
            } finally {
                document.getElementById(id)?.remove();
                document.getElementById(`d${id}`)?.remove();
            }
        }
        return { value, generatedUrls };
    }

    private svgToPng(svgString: string): Promise<Blob> {
        const scale = this.scale;
        const sanitized = this.sanitizeSvg(svgString);
        const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(sanitized)}`;

        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                let canvasWidth = img.naturalWidth * scale;
                let canvasHeight = img.naturalHeight * scale;
                if (canvasWidth > MAX_CANVAS_DIMENSION || canvasHeight > MAX_CANVAS_DIMENSION) {
                    const downscale = Math.min(
                        MAX_CANVAS_DIMENSION / canvasWidth,
                        MAX_CANVAS_DIMENSION / canvasHeight
                    );
                    canvasWidth = Math.floor(canvasWidth * downscale);
                    canvasHeight = Math.floor(canvasHeight * downscale);
                }

                const canvas = document.createElement("canvas");
                canvas.width = canvasWidth;
                canvas.height = canvasHeight;
                const ctx = canvas.getContext("2d")!;
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.scale(scale, scale);
                ctx.drawImage(img, 0, 0);
                canvas.toBlob((blob) => {
                    if (blob) resolve(blob);
                    else reject(new Error("canvas.toBlob returned null"));
                }, "image/png");
            };
            img.onerror = (e) => reject(e);
            img.src = dataUrl;
        });
    }

    /**
     * Sanitize mermaid SVG for safe loading via <img> data URI.
     *
     * Uses innerHTML (lenient HTML parser) instead of DOMParser (strict XML parser)
     * because mermaid CSS contains unescaped quotes/selectors that break XML parsing.
     * XMLSerializer then outputs valid XML with proper escaping.
     */
    private sanitizeSvg(svgString: string): string {
        const container = document.createElement("div");
        container.innerHTML = svgString;
        const svgEl = container.querySelector("svg");
        if (!svgEl) return svgString;

        this.replaceForeignObjects(svgEl);
        this.sanitizeSvgCss(svgEl);
        this.fixSvgDimensions(svgEl);
        svgEl.removeAttribute("style");

        return new XMLSerializer().serializeToString(svgEl);
    }

    private replaceForeignObjects(svgEl: SVGSVGElement): void {
        const SVG_NS = "http://www.w3.org/2000/svg";
        svgEl.querySelectorAll("foreignObject").forEach(fo => {
            const x = parseFloat(fo.getAttribute("x") || "0");
            const y = parseFloat(fo.getAttribute("y") || "0");
            const width = parseFloat(fo.getAttribute("width") || "100");
            const height = parseFloat(fo.getAttribute("height") || "50");

            const lines = this.extractTextLines(fo);
            if (lines.length === 0) { fo.remove(); return; }

            const styledEl = fo.querySelector("span, div, p") as HTMLElement | null;
            const computed = styledEl ? window.getComputedStyle(styledEl) : null;
            const fontSize = parseFloat(computed?.fontSize || "14");
            const fontFamily = computed?.fontFamily || "sans-serif";
            const fill = computed?.color || "#333";

            const textEl = document.createElementNS(SVG_NS, "text");
            textEl.setAttribute("text-anchor", "middle");
            textEl.setAttribute("font-size", String(fontSize));
            textEl.setAttribute("font-family", fontFamily);
            textEl.setAttribute("fill", fill);

            const centerX = x + width / 2;

            if (lines.length === 1) {
                textEl.setAttribute("x", String(centerX));
                textEl.setAttribute("y", String(y + height / 2));
                textEl.setAttribute("dominant-baseline", "middle");
                textEl.textContent = lines[0];
            } else {
                const lineHeight = fontSize * 1.2;
                const totalTextHeight = lineHeight * lines.length;
                const startY = y + (height - totalTextHeight) / 2 + fontSize;
                for (let i = 0; i < lines.length; i++) {
                    const tspan = document.createElementNS(SVG_NS, "tspan");
                    tspan.setAttribute("x", String(centerX));
                    tspan.setAttribute("y", String(startY + i * lineHeight));
                    tspan.textContent = lines[i];
                    textEl.appendChild(tspan);
                }
            }

            fo.parentNode?.replaceChild(textEl, fo);
        });

        svgEl.querySelectorAll("switch").forEach(sw => {
            while (sw.firstChild) sw.parentNode?.insertBefore(sw.firstChild, sw);
            sw.remove();
        });
    }

    private extractTextLines(fo: Element): string[] {
        const lines: string[] = [];
        let current = "";
        const walk = (node: Node) => {
            if (node.nodeType === Node.TEXT_NODE) {
                current += node.textContent?.trim() || "";
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                if ((node as Element).tagName.toLowerCase() === "br") {
                    if (current) { lines.push(current); current = ""; }
                } else {
                    node.childNodes.forEach(walk);
                }
            }
        };
        fo.childNodes.forEach(walk);
        if (current) lines.push(current);
        return lines;
    }

    private sanitizeSvgCss(svgEl: SVGSVGElement): void {
        svgEl.querySelectorAll("style").forEach(style => {
            style.textContent = (style.textContent || "").replace(/:root\s*\{[^}]*\}/g, "");
        });
    }

    private fixSvgDimensions(svgEl: SVGSVGElement): void {
        const viewBox = svgEl.getAttribute("viewBox")?.split(/[\s,]+/).map(Number);
        const isAbsolute = (v: string | null) =>
            v != null && parseFloat(v) > 0 && /^\d+(\.\d+)?(px)?$/.test(v.trim());

        if (!isAbsolute(svgEl.getAttribute("width")) || !isAbsolute(svgEl.getAttribute("height"))) {
            if (viewBox?.length === 4) {
                svgEl.setAttribute("width", String(viewBox[2]));
                svgEl.setAttribute("height", String(viewBox[3]));
            } else {
                svgEl.setAttribute("width", "1200");
                svgEl.setAttribute("height", "800");
            }
        }
    }

    private ensureSvgDimensions(svgString: string): string {
        try {
            const doc = new DOMParser().parseFromString(svgString, "image/svg+xml");
            const el = doc.querySelector("svg");
            if (!el) return svgString;

            const viewBox = el.getAttribute("viewBox")?.split(/[\s,]+/).map(Number);
            const hasWidth = el.hasAttribute("width") && parseFloat(el.getAttribute("width")!) > 0;
            const hasHeight = el.hasAttribute("height") && parseFloat(el.getAttribute("height")!) > 0;

            if (!hasWidth || !hasHeight) {
                if (viewBox?.length === 4) {
                    el.setAttribute("width", String(viewBox[2]));
                    el.setAttribute("height", String(viewBox[3]));
                } else {
                    el.setAttribute("width", "1200");
                    el.setAttribute("height", "800");
                }
            }

            return new XMLSerializer().serializeToString(doc);
        } catch {
            return svgString;
        }
    }
}
