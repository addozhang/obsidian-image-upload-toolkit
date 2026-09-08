import {describe, expect, it} from "vitest";
import ImageStore from "../../src/imageStore";
import {PROVIDERS, getProvider, requireProvider} from "../../src/providers/registry";
import buildUploader from "../../src/uploader/imageUploaderBuilder";

function settings(imageStore: string): any {
    return {
        imageStore,
        imgurAnonymousSetting: {clientId: "cid"},
        gyazoSetting: {accessToken: "t", accessPolicy: "anyone", desc: ""},
        ossSetting: {},
        imagekitSetting: {},
        awsS3Setting: {region: "us-east-1"},
        cosSetting: {},
        kodoSetting: {},
        githubSetting: {repositoryName: "owner/repo", branchName: "main", token: "t", path: ""},
        r2Setting: {},
        b2Setting: {region: "us-west-004"},
    };
}

describe("provider registry", () => {
    it("registers exactly one descriptor per ImageStore entry", () => {
        const storeIds = ImageStore.lists.map(store => store.id).sort();
        const providerIds = PROVIDERS.map(provider => provider.store.id).sort();
        expect(providerIds).toEqual(storeIds);
    });

    it.each(PROVIDERS.map(p => [p.store.id]))("%s exposes a complete descriptor", id => {
        const provider = requireProvider(id);
        expect(typeof provider.build).toBe("function");
        expect(typeof provider.isHosted).toBe("function");
        expect(typeof provider.drawSettings).toBe("function");
    });

    it("resolves providers case-sensitively by canonical id", () => {
        expect(getProvider("GITHUB")?.store.id).toBe("GITHUB");
        expect(getProvider("Imagekit")?.store.id).toBe("Imagekit");
    });

    it("returns undefined for unknown ids", () => {
        expect(getProvider("NOT_A_STORE")).toBeUndefined();
        expect(() => requireProvider("NOT_A_STORE")).toThrow(/Unknown image store/);
    });

    it("buildUploader delegates through the registry", () => {
        const uploader = buildUploader(settings("GITHUB"));
        expect(uploader).toBeDefined();
        expect(typeof uploader.upload).toBe("function");
    });
});
