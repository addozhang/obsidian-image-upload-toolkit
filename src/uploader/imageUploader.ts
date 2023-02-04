export default interface ImageUploader {
    upload(image: File, path: string): Promise<string>;
}

