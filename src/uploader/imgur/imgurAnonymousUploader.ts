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

        if (resp.status != 200) {
            handleImgurErrorResponse(resp);
        }
        return (resp.json as ImgurPostData).data.link;
    }
}

export interface ImgurAnonymousSetting {
    clientId: string;
}

export function handleImgurErrorResponse(resp: RequestUrlResponse): void {
    if (resp.headers["Content-Type"] === "application/json") {
        throw new ApiError((resp.json as ImgurErrorData).data.error);
    }
    throw new Error(resp.text);
}