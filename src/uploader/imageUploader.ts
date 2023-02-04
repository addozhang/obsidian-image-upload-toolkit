export default interface ImageUploader {
    upload(image: File, fullPath: string): Promise<string>;
}

