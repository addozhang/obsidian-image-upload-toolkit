
import ImageUploader from "../imageUploader";
import {IMGUR_API_BASE} from "./constants";
import {handleImgurErrorResponse} from "./imgurClient";
import {ImgurPostData} from "./imgurResponseTypes";
import {requestUrl} from "obsidian";

export default class ImgurAnonymousUploader implements ImageUploader {
    private readonly clientId!: string;

    constructor(clientId: string) {
        this.clientId = clientId;
    }

    async upload(image: File): Promise<string> {
        const requestData = new FormData();
        requestData.append("image", image);
        const resp = await fetch(`${IMGUR_API_BASE}image`, {
            method: "POST",
            headers: new Headers({ Authorization: `Client-ID ${this.clientId}` }),
            body: requestData,
        });

        if (!resp.ok) {
            await handleImgurErrorResponse(resp);
        }
        return ((await resp.json()) as ImgurPostData).data.link;
    }
}

export interface ImgurAnonymousSetting {
    clientId: string;
}