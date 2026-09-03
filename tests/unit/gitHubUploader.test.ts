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

function createUploader(path = ""): GitHubUploader {
    return new GitHubUploader({
        repositoryName: "owner/repo",
        branchName: "main",
        token: "token",
        path,
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

    it("uses the configured path template for the remote file path", async () => {
        const uploader = createUploader("images/{year}/{filename}");

        const url = await uploader.upload(new File(["data"], "pic v1.png"), "/pic v1.png");

        const call = octokitMocks.createOrUpdateFileContents.mock.calls[0][0];
        expect(call.path).toMatch(/^images\/\d{4}\/pic v1\.png$/);
        expect(url).toBe(
            `https://raw.githubusercontent.com/owner/repo/main/${call.path.split('/').map(encodeURIComponent).join('/')}`,
        );
        expect(url).not.toContain("pic v1.png");
    });

    it("encodes special characters in the returned raw URL", async () => {
        const uploader = createUploader();

        const url = await uploader.upload(new File(["data"], "图片 名.png"), "/图片 名.png");

        expect(octokitMocks.createOrUpdateFileContents).toHaveBeenCalledWith(
            expect.objectContaining({path: "图片 名.png"}),
        );
        expect(url).toBe(
            "https://raw.githubusercontent.com/owner/repo/main/%E5%9B%BE%E7%89%87%20%E5%90%8D.png",
        );
    });

    it("appends {filename} to a plain-folder path so uploads don't overwrite each other", async () => {
        const folderUploader = createUploader("images");
        const nestedUploader = createUploader("images/{year}/{mon}");

        await folderUploader.upload(new File(["data"], "pic.png"), "/pic.png");
        await nestedUploader.upload(new File(["data"], "pic.png"), "/pic.png");

        expect(octokitMocks.createOrUpdateFileContents.mock.calls[0][0].path)
            .toMatch(/^images\/pic\.png$/);
        expect(octokitMocks.createOrUpdateFileContents.mock.calls[1][0].path)
            .toMatch(/^images\/\d{4}\/\d{2}\/pic\.png$/);
    });

    it("passes the existing file sha when updating", async () => {
        octokitMocks.getContent.mockResolvedValue({
            data: {sha: "abc123"},
        });

        const uploader = createUploader();
        await uploader.upload(new File(["data"], "first.png"), "/first.png");

        expect(octokitMocks.createOrUpdateFileContents).toHaveBeenCalledWith(
            expect.objectContaining({sha: "abc123"}),
        );
    });
});
