import {Setting} from "obsidian";
import type ObsidianPublish from "../../publish";
import ImageStore from "../../imageStore";
import type {ProviderDescriptor} from "../../providers/types";
import GitHubUploader from "./gitHubUploader";

function githubTokenDescription() {
    const url = "https://github.com/settings/tokens";
    return createFragment(frag => {
        frag.append("Generate a personal access token with 'repo' scope at ");
        frag.createEl("a", { text: url, href: url });
    });
}

function drawSettings(parentEl: HTMLElement, plugin: ObsidianPublish): void {
    new Setting(parentEl)
        .setName("Repository name")
        .setDesc("The name of the GitHub repository to store images (format: owner/repo).")
        .addText(text =>
            text
                .setPlaceholder("Enter repository name (e.g., username/repo)")
                .setValue(plugin.settings.githubSetting.repositoryName)
                .onChange(value => plugin.settings.githubSetting.repositoryName = value)
        );

    new Setting(parentEl)
        .setName("Branch name")
        .setDesc("The branch to store images in (defaults to 'main').")
        .addText(text =>
            text
                .setPlaceholder("Enter branch name")
                .setValue(plugin.settings.githubSetting.branchName)
                .onChange(value => plugin.settings.githubSetting.branchName = value)
        );

    new Setting(parentEl)
        .setName("Personal access token")
        .setDesc(githubTokenDescription())
        .addText(text =>
            text
                .setPlaceholder("Enter your GitHub personal access token")
                .setValue(plugin.settings.githubSetting.token)
                .onChange(value => plugin.settings.githubSetting.token = value)
        );

    new Setting(parentEl)
        .setName("Target Path")
        .setDesc("The path to store images within the repository.\nSupport {year} {mon} {day} {random} {filename} vars. For example, images/{year}/{mon}/{day}/{filename} with uploading pic.jpg, it will store as images/2023/06/08/pic.jpg.")
        .addText(text =>
            text
                .setPlaceholder("Enter path")
                .setValue(plugin.settings.githubSetting.path)
                .onChange(value => plugin.settings.githubSetting.path = value)
        );
}

export const GITHUB_PROVIDER: ProviderDescriptor = {
    store: ImageStore.GITHUB,
    build: settings => new GitHubUploader(settings.githubSetting),
    isHosted: (url, settings) => {
        const hostname = new URL(url).hostname;
        const isGitHubHost = hostname.includes("github.com") || hostname.includes("githubusercontent.com");
        if (settings.githubSetting?.repositoryName) {
            // GitHubUploader returns raw.githubusercontent.com/{owner}/{repo}/...
            // which does not contain "github.com", so the host check must
            // accept githubusercontent hosts too
            return isGitHubHost && url.includes(settings.githubSetting.repositoryName);
        }
        return isGitHubHost;
    },
    drawSettings,
};
