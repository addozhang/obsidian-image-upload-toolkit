import {beforeEach, describe, expect, it, vi} from "vitest";

const octokitMocks = vi.hoisted(() => ({
    getContent: vi.fn(),
    createOrUpdateFileContents: vi.fn(),
}));

vi.mock("@octokit/rest", () => ({
    Octokit: class {
        repos = octokitMocks;
    },
}));

import GitHubUploader from "../../src/uploader/github/gitHubUploader";

function createUploader(): GitHubUploader {
    return new GitHubUploader({
        repositoryName: "owner/repo",
        branchName: "main",
        token: "token",
        path: "",
    });
}

describe("GitHubUploader", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        octokitMocks.getContent.mockRejectedValue(new Error("Not found"));
        octokitMocks.createOrUpdateFileContents.mockResolvedValue({});
    });

    it("serializes concurrent uploads to the same branch", async () => {
        let finishFirstUpload: () => void;
        const firstUpload = new Promise<void>(resolve => {
            finishFirstUpload = resolve;
        });
        octokitMocks.createOrUpdateFileContents
            .mockImplementationOnce(() => firstUpload)
            .mockResolvedValueOnce({});

        const uploader = createUploader();
        const first = uploader.upload(new File(["first"], "first.png"), "/first.png");
        const second = uploader.upload(new File(["second"], "second.png"), "/second.png");

        await vi.waitFor(() => {
            expect(octokitMocks.createOrUpdateFileContents).toHaveBeenCalledTimes(1);
        });
        expect(octokitMocks.getContent).toHaveBeenCalledTimes(1);

        finishFirstUpload!();
        await expect(Promise.all([first, second])).resolves.toEqual([
            "https://raw.githubusercontent.com/owner/repo/main/first.png",
            "https://raw.githubusercontent.com/owner/repo/main/second.png",
        ]);
        expect(octokitMocks.createOrUpdateFileContents).toHaveBeenCalledTimes(2);
    });

    it("continues the queue after an upload fails", async () => {
        octokitMocks.createOrUpdateFileContents
            .mockRejectedValueOnce(new Error("Conflict"))
            .mockResolvedValueOnce({});

        const uploader = createUploader();
        const first = uploader.upload(new File(["first"], "first.png"), "/first.png");
        const second = uploader.upload(new File(["second"], "second.png"), "/second.png");

        await expect(first).rejects.toThrow("Conflict");
        await expect(second).resolves.toBe(
            "https://raw.githubusercontent.com/owner/repo/main/second.png",
        );
        expect(octokitMocks.createOrUpdateFileContents).toHaveBeenCalledTimes(2);
    });
});
