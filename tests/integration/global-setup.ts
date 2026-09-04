import {copyFileSync, mkdirSync} from "node:fs";
import {createSetup} from "obsidian-integration-testing/vitest-global-setup-plugin";

/**
 * The plugin-global-setup looks for the built plugin in `dist/dev` or
 * `dist/build` (newest main.js wins). Our production build outputs to
 * `dist/`, so mirror the artifacts into `dist/dev` before setup runs.
 */
function stagePluginBuild(): void {
    mkdirSync("dist/dev", {recursive: true});
    copyFileSync("dist/main.js", "dist/dev/main.js");
    copyFileSync("dist/manifest.json", "dist/dev/manifest.json");
    copyFileSync("src/styles.css", "dist/dev/styles.css");
}

export interface IntegrationSettings {
    githubToken: string;
    githubRepo: string;
}

export function readIntegrationSettings(): IntegrationSettings {
    return {
        githubToken: process.env.IUT_E2E_GITHUB_TOKEN ?? "",
        githubRepo: process.env.IUT_E2E_GITHUB_REPO ?? "addozhang/image-repo",
    };
}

const {setup: baseSetup, teardown} = createSetup({
    populate: () => {
        const {githubToken, githubRepo} = readIntegrationSettings();
        // Minimal settings on purpose: the plugin merges the rest from
        // DEFAULT_SETTINGS on load. replaceOriginalDoc lets the publish-flow
        // test assert on the editor buffer instead of the clipboard, which is
        // unreliable in an unfocused/off-screen window.
        const data = {
            imageStore: "GITHUB",
            replaceOriginalDoc: true,
            showProgressModal: false,
            githubSetting: {
                repositoryName: githubRepo,
                branchName: "main",
                token: githubToken,
                path: "{year}/{mon}/{day}/{filename}",
            },
        };
        return {
            ".obsidian/plugins/image-upload-toolkit/data.json": JSON.stringify(data, null, 2),
        };
    },
});

export function setup(...args: Parameters<typeof baseSetup>): Promise<void> {
    stagePluginBuild();
    return baseSetup(...args);
}

export {teardown};
