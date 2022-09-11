export default class ImageStore {
    private static readonly values: ImageStore[] = [];

    static get lists(): ReadonlyArray<ImageStore> {
        return this.values;
    }

    static readonly ANONYMOUS_IMGUR = new ImageStore(
        "ANONYMOUS_IMGUR",
        "Anonymous Imgur upload"
    )

    private constructor(readonly id: string, readonly description: string) {
        ImageStore.values.push(this)
    }
}