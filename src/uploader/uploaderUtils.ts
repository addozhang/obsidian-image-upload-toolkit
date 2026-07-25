export class UploaderUtils {
    static generateName(pathTmpl: string | undefined, imageName: string): string {
        const date = new Date();
        const year = date.getFullYear().toString();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const random = this.generateRandomString(20);

        return pathTmpl != undefined && pathTmpl.trim().length > 0 ? pathTmpl
                .replace('{year}', year)
                .replace('{mon}', month)
                .replace('{day}', day)
                .replace('{random}', random)
                .replace('{filename}', imageName)
            : imageName
            ;
    }

    private static generateRandomString(length: number): string {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';

        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * characters.length);
            result += characters.charAt(randomIndex);
        }

        return result;
    }

    static customizeDomainName(url: string, customDomainName: string): string {
        const regex = /https?:\/\/([^/]+)/;
        customDomainName = customDomainName.replaceAll('https://', '')
        if (customDomainName && customDomainName.trim() !== "") {
            if (url.match(regex) != null) {
                return url.replace(regex, (match, domain: string) => {
                    return match.replace(domain, customDomainName);
                })
            } else {
                return `https://${customDomainName}/${this.encodePath(url)}`;
            }
        }
        return url;
    }

    private static encodePath(path: string): string {
        return path.split('/').map((segment) => {
            try {
                return encodeURIComponent(decodeURIComponent(segment));
            } catch {
                return encodeURIComponent(segment);
            }
        }).join('/');
    }

    /**
     * Strip leading/trailing whitespace (including newlines) from a credential
     * field. Returns an empty string for null/undefined input so downstream
     * callers don't need to guard.
     *
     * Pasting credentials from the web frequently introduces trailing newlines
     * or spaces. AWS-family SDKs reject these with cryptic signing errors, so
     * we normalize at the boundary.
     */
    static trimCredential(value: string | undefined | null): string {
        return (value ?? "").trim();
    }

    /**
     * Normalize an S3/R2/B2 endpoint URL: trims whitespace and removes any
     * trailing slash so the AWS SDK's URL composition does not produce a
     * double-slashed path that hangs or 400s.
     */
    static normalizeEndpoint(endpoint: string | undefined | null): string {
        const trimmed = (endpoint ?? "").trim();
        return trimmed.replace(/\/+$/, "");
    }
}
