import {describe, expect, it, vi} from "vitest";
import ImageStore from "../../src/imageStore";
import ImageTagProcessor from "../../src/uploader/imageTagProcessor";
import type {PublishSettings} from "../../src/publish";

const GTM_NOTE_IMAGE = '<img src="Anexos/files/Pasted image 20260702143718.png" alt="Google Tag Manager mostrando container SSG SHOP VTEX">';

function makeSettings(processHtmlImageTags: boolean): PublishSettings {
    return {
        imageStore: ImageStore.IMGUR.id,
        processHtmlImageTags,
        uploadWebImages: false,
    } as PublishSettings;
}

function makeProcessor(processHtmlImageTags: boolean, existingPaths: string[]): ImageTagProcessor {
    const existingPathSet = new Set(existingPaths);
    const app = {
        vault: {
            adapter: {
                getBasePath: () => "/mock/vault",
                readBinary: vi.fn(),
            },
            getAbstractFileByPath: vi.fn(path => existingPathSet.has(path)),
        },
        workspace: {
            getActiveFile: () => ({path: "Sansung/E-mails/Validacao de consolidacao das tags Google no GTM.md"}),
            getActiveViewOfType: vi.fn(),
        },
        metadataCache: {
            getFirstLinkpathDest: vi.fn(),
        },
    };
    const uploader = {upload: vi.fn()};
    return new ImageTagProcessor(app as any, makeSettings(processHtmlImageTags), uploader as any, false);
}

function collectImages(processor: ImageTagProcessor, markdown: string) {
    return (processor as any).getImageLists(markdown);
}

describe("ImageTagProcessor HTML image tags", () => {
    it("ignores HTML image tags when the setting is disabled", () => {
        const processor = makeProcessor(false, ["Anexos/files/Pasted image 20260702143718.png"]);

        expect(collectImages(processor, GTM_NOTE_IMAGE)).toEqual([]);
    });

    it("collects root vault HTML image tags when the setting is enabled", () => {
        const processor = makeProcessor(true, ["Anexos/files/Pasted image 20260702143718.png"]);

        expect(collectImages(processor, GTM_NOTE_IMAGE)).toEqual([
            {
                name: "Anexos/files/Pasted image 20260702143718.png",
                path: "Anexos/files/Pasted image 20260702143718.png",
                source: GTM_NOTE_IMAGE,
                url: "",
                htmlSrc: "Anexos/files/Pasted image 20260702143718.png",
            },
        ]);
    });

    it("falls back to active-note relative paths for HTML image tags", () => {
        const processor = makeProcessor(true, ["Sansung/E-mails/Anexos/files/Pasted image.png"]);
        const imageTag = '<img src="Anexos/files/Pasted image.png" alt="Relative image">';

        expect(collectImages(processor, imageTag)[0]).toMatchObject({
            name: "Anexos/files/Pasted image.png",
            path: "Sansung/E-mails/Anexos/files/Pasted image.png",
            source: imageTag,
            htmlSrc: "Anexos/files/Pasted image.png",
        });
    });
});
