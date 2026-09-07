import {describe, expect, it} from "vitest";
import {evalInObsidian, openObsidianSettingsTab} from "obsidian-integration-testing";
import {getTemporaryVault} from "obsidian-integration-testing/vitest-global-setup-plugin";

const PLUGIN_ID = "image-upload-toolkit";
const STORE_IDS = [
    "IMGUR",
    "GYAZO",
    "ALIYUN_OSS",
    "Imagekit",
    "AWS_S3",
    "TENCENTCLOUD_COS",
    "QINIU_KUDO",
    "GITHUB",
    "CLOUDFLARE_R2",
    "BACKBLAZE_B2",
];

const vault = getTemporaryVault();

describe("image-upload-toolkit settings panel (integration)", () => {
    it("renders every provider's settings section without throwing", async () => {
        await openObsidianSettingsTab({tabId: PLUGIN_ID, vaultPath: vault.path});

        const results: Array<{id: string; ok: boolean; textLength: number}> = [];
        for (const id of STORE_IDS) {
            const result = await evalInObsidian({
                input: {pluginId: PLUGIN_ID, storeId: id},
                callback: ({app, pluginId, storeId}) => {
                    const a = app as any;
                    const plugin = a.plugins.plugins[pluginId];
                    const tab = a.setting?.activeTab;
                    if (!tab) {
                        throw new Error("plugin settings tab is not active");
                    }
                    plugin.settings.imageStore = storeId;
                    tab.display();
                    const text = tab.containerEl?.textContent ?? "";
                    return {ok: text.length > 200, textLength: text.length};
                },
                vaultPath: vault.path,
            });
            results.push({id, ...result});
        }

        await evalInObsidian({
            input: {pluginId: PLUGIN_ID},
            callback: ({app, pluginId}) => {
                const a = app as any;
                // leave the shared instance in its seeded state
                a.plugins.plugins[pluginId].settings.imageStore = "GITHUB";
                a.setting?.close();
            },
            vaultPath: vault.path,
        });

        const broken = results.filter((r) => !r.ok);
        expect(broken, `sections with no/minimal content: ${JSON.stringify(broken)}`).toEqual([]);
        expect(results).toHaveLength(STORE_IDS.length);
    });
});
