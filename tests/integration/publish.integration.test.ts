import {afterAll, describe, expect, it} from "vitest";
import {evalInObsidian, pollInObsidian} from "obsidian-integration-testing";
import {getTemporaryVault} from "obsidian-integration-testing/vitest-global-setup-plugin";
import {readIntegrationSettings} from "./global-setup";

const PLUGIN_ID = "image-upload-toolkit";
const ONE_BY_ONE_PNG_BASE64 =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";

const settings = readIntegrationSettings();
const hasCreds = settings.githubToken.length > 0;
const vault = getTemporaryVault();

// Repo-relative paths of files uploaded by this run, pruned in afterAll.
const sentinelPaths: string[] = [];

/**
 * Extract the decoded repo-relative path from a raw.githubusercontent URL.
 * Raw URL shape: /{owner}/{repo}/{branch}/{path} — assumes a single-segment
 * branch, which holds for the 'main' branch configured in global-setup.
 */
function repoPathFromRawUrl(url: string): string {
    const parts = decodeURIComponent(new URL(url).pathname).split("/").filter(Boolean);
    return parts.slice(3).join("/");
}

/** Prune a sentinel from the GitHub repo. Best-effort: failures must not fail tests. */
async function pruneGithubFile(remotePath: string): Promise<void> {
    const apiPath = remotePath.split("/").map(encodeURIComponent).join("/");
    const headers = {
        Authorization: `token ${settings.githubToken}`,
        Accept: "application/vnd.github+json",
    };
    try {
        const head = await fetch(`https://api.github.com/repos/${settings.githubRepo}/contents/${apiPath}`, {headers});
        if (!head.ok) return;
        const {sha} = (await head.json()) as {sha: string};
        await fetch(`https://api.github.com/repos/${settings.githubRepo}/contents/${apiPath}`, {
            method: "DELETE",
            headers: {...headers, "Content-Type": "application/json"},
            body: JSON.stringify({sha, message: "chore: prune integration test sentinel"}),
        });
    } catch {
        // leftover sentinel files are harmless
    }
}

afterAll(async () => {
    if (!hasCreds) return;
    for (const p of sentinelPaths) {
        await pruneGithubFile(p);
    }
});

describe("image-upload-toolkit (integration)", () => {
    it("plugin loads with GitHub store configured", async () => {
        const info = await evalInObsidian({
            input: {pluginId: PLUGIN_ID},
            callback: ({app, pluginId}) => {
                const plugins = (app as any).plugins;
                const plugin = plugins.plugins[pluginId];
                return {
                    enabled: plugins.enabledPlugins.has(pluginId),
                    version: plugin?.manifest?.version ?? null,
                    store: plugin?.settings?.imageStore ?? null,
                    hasUploader: !!plugin?.imageUploader,
                };
            },
            vaultPath: vault.path,
        });

        expect(info.enabled).toBe(true);
        expect(info.version).toMatch(/^\d+\.\d+\.\d+$/);
        expect(info.store).toBe("GITHUB");
        expect(info.hasUploader).toBe(true);
    });

    it.skipIf(!hasCreds)("uploads a sentinel with the path template applied", async () => {
        const result = await evalInObsidian({
            input: {pluginId: PLUGIN_ID, b64: ONE_BY_ONE_PNG_BASE64},
            callback: async ({app, pluginId, b64}) => {
                const plugin = (app as any).plugins.plugins[pluginId];
                const bin = atob(b64);
                const bytes = new Uint8Array(bin.length);
                for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
                const name = `iut-it-sentinel-${Date.now()}.png`;
                const url = await plugin.imageUploader.upload(new File([bytes], name, {type: "image/png"}), name);
                return {url, name};
            },
            vaultPath: vault.path,
        });





        // record the sentinel before asserting so a failed assertion still
        // leaves it scheduled for afterAll cleanup
        sentinelPaths.push(repoPathFromRawUrl(result.url));

        const escaped = settings.githubRepo.replaceAll("/", "\\/");
        const pattern = new RegExp(
            `^https:\\/\\/raw\\.githubusercontent\\.com\\/${escaped}\\/main\\/\\d{4}\\/\\d{2}\\/\\d{2}\\/iut-it-sentinel-\\d+\\.png$`,
        );
        expect(result.url).toMatch(pattern);

        // unauthenticated fetch works because the target repo must be public
        const remote = await fetch(result.url);
        expect(remote.status).toBe(200);
    });

    it.skipIf(!hasCreds)("full publish flow rewrites the editor with an encoded remote URL", async () => {
        const stamp = Date.now();
        const imageName = `iut-it-图片 测试-${stamp}.png`;
        const noteName = `iut-it-note-${stamp}.md`;

        const editorValue = await pollInObsidian({
            vaultPath: vault.path,
            input: {pluginId: PLUGIN_ID, b64: ONE_BY_ONE_PNG_BASE64, imageName, noteName},
            start: async ({app, pluginId, imageName, noteName, b64}) => {
                const a = app as any;
                const bin = atob(b64);
                const bytes = new Uint8Array(bin.length);
                for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
                await a.vault.adapter.writeBinary(imageName, bytes.buffer.slice(0));

                await a.vault.create(noteName, `![](${imageName})\n`);
                const note = a.vault.getAbstractFileByPath(noteName);
                const leaf = a.workspace.getLeaf(true);
                await leaf.openFile(note);
                leaf.view.editor.setValue(`![](${imageName})\n`);

                // wait for the metadata index so the embed resolves to a vault file
                for (let i = 0; i < 20; i++) {
                    const resolved = a.metadataCache.getFirstLinkpathDest(imageName, noteName);
                    if (resolved) break;
                    await new Promise((r: (v: void) => void) => setTimeout(r, 250));
                }

                await a.commands.executeCommandById(`${pluginId}:publish-page`);
            },
            poll: async ({app, noteName}) => {
                const a = app as any;
                for (const leaf of a.workspace.getLeavesOfType("markdown")) {
                    const file = leaf.view?.getFile?.();
                    if (file?.path === noteName) {
                        return leaf.view.editor.getValue() as string;
                    }
                }
                return "";
            },
            until: (value) => typeof value === "string" && value.includes("raw.githubusercontent.com"),
            // fail with a clear poll timeout before vitest's 120s testTimeout
            timeoutInMilliseconds: 90_000,
            timeoutMessage: "publish flow did not rewrite the editor with a raw.githubusercontent URL in time",
        });

        const match = editorValue.match(/!\[[^\]]*\]\((https:[^)]+)\)/);
        expect(match).not.toBeNull();
        const remoteUrl = match![1];
        sentinelPaths.push(repoPathFromRawUrl(remoteUrl));

        expect(remoteUrl).toContain(encodeURIComponent("图片 测试"));
        // alt text derives from the filename (dashes -> spaces), stamp included
        const escapedUrl = remoteUrl.replaceAll(/[.*+?^${}()|[\]\\]/g, "\\$&");
        expect(editorValue).toMatch(new RegExp(`!\\[[^\\]]*图片 测试[^\\]]*\\]\\(${escapedUrl}\\)`));

        const remote = await fetch(remoteUrl);
        expect(remote.status).toBe(200);

        await evalInObsidian({
            input: {imageName, noteName},
            callback: async ({app, imageName, noteName}) => {
                const a = app as any;
                for (const leaf of a.workspace.getLeavesOfType("markdown")) {
                    if (leaf.view?.getFile?.()?.path === noteName) leaf.detach();
                }
                const note = a.vault.getAbstractFileByPath(noteName);
                if (note) await a.vault.delete(note, true);
                const image = a.vault.getAbstractFileByPath(imageName);
                if (image) await a.vault.delete(image, true);
            },
            vaultPath: vault.path,
        });
    });
});
