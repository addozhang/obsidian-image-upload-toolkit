import ImageUploader from "../imageUploader";
import {IMGUR_API_BASE} from "./constants";
import {ImgurErrorData, ImgurPostData} from "./imgurResponseTypes";
import {requestUrl, RequestUrlResponse} from "obsidian";
import ApiError from "../apiError";

export default class ImgurAnonymousUploader implements ImageUploader {
    private readonly clientId!: string;

    constructor(clientId: string) {
        this.clientId = clientId;
    }

    async upload(image: File, path: string): Promise<string> {
        const requestData = new FormData();
        requestData.append("image", image);
        const resp = await requestUrl({
            body: await image.arrayBuffer(),
            headers: {Authorization: `Client-ID ${this.clientId}`},
            method: "POST",
            url: `${IMGUR_API_BASE}image`})

        if ((await resp).status != 200) {
            await handleImgurErrorResponse(resp);
        }
        return ((await resp.json) as ImgurPostData).data.link;
    }
}

export interface ImgurAnonymousSetting {
    clientId: string;
}

export async function handleImgurErrorResponse(resp: RequestUrlResponse): Promise<void> {
    if ((await resp).headers["Content-Type"] === "application/json") {
        throw new ApiError(((await resp.json) as ImgurErrorData).data.error);
    }
    throw new Error(resp.text);
}