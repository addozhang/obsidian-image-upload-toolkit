import path from "path";

export class UploaderUtils {
    static generateName(pathTmpl,imageName: string): string {
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

    static customizeDomainName(url, customDomainName) {
        const regex = /https?:\/\/([^/]+)/;
        customDomainName = customDomainName.replaceAll('https://', '')
        if (customDomainName && customDomainName.trim() !== "") {
            if (url.match(regex) != null) {
                return url.replace(regex, (match, domain) => {
                    return match.replace(domain, customDomainName);
                })
            } else {
                return `https://${customDomainName}/${url}`;
            }
        }
        return url;
    }
}