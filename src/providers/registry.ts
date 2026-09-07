import ImageStore from "../imageStore";
import type {ProviderDescriptor} from "./types";
import {IMGUR_PROVIDER} from "../uploader/imgur/provider";
import {GYAZO_PROVIDER} from "../uploader/gyazo/provider";
import {OSS_PROVIDER} from "../uploader/oss/provider";
import {IMAGEKIT_PROVIDER} from "../uploader/imagekit/provider";
import {AWS_S3_PROVIDER} from "../uploader/s3/provider";
import {COS_PROVIDER} from "../uploader/cos/provider";
import {KODO_PROVIDER} from "../uploader/qiniu/provider";
import {GITHUB_PROVIDER} from "../uploader/github/provider";
import {CLOUDFLARE_R2_PROVIDER} from "../uploader/r2/provider";
import {BACKBLAZE_B2_PROVIDER} from "../uploader/b2/provider";

export const PROVIDERS: readonly ProviderDescriptor[] = [
    IMGUR_PROVIDER,
    GYAZO_PROVIDER,
    OSS_PROVIDER,
    IMAGEKIT_PROVIDER,
    AWS_S3_PROVIDER,
    COS_PROVIDER,
    KODO_PROVIDER,
    GITHUB_PROVIDER,
    CLOUDFLARE_R2_PROVIDER,
    BACKBLAZE_B2_PROVIDER,
];

export function getProvider(storeId: string): ProviderDescriptor | undefined {
    return PROVIDERS.find(provider => provider.store.id === storeId);
}

export function requireProvider(storeId: string): ProviderDescriptor {
    const provider = getProvider(storeId);
    if (!provider) {
        throw new Error(`Unknown image store: ${storeId}`);
    }
    return provider;
}

/**
 * Registration sanity: every ImageStore entry must have exactly one
 * provider descriptor. Runs once at module load so a half-registered
 * provider fails fast instead of surfacing as a broken switch arm.
 */
const registeredIds = new Set(PROVIDERS.map(provider => provider.store.id));
for (const store of ImageStore.lists) {
    if (!registeredIds.has(store.id)) {
        throw new Error(`ImageStore ${store.id} has no provider descriptor`);
    }
}
