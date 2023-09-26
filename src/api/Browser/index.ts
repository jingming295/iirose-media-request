import * as fs from 'fs';
import * as https from 'https';
import unzipper from 'unzipper';
import * as path from 'path';

export class DownloadBrowser {

    private mkdir(path: string) {
        const targetFolder = path;
        if (!fs.existsSync(targetFolder)) {
            fs.mkdirSync(targetFolder);
        }
        return targetFolder;
    }

    toPath(thepath: string) {
        const extractedPath = path.dirname(path.dirname(path.dirname(thepath)));
        console.log(`extractedPath: ${extractedPath}`);
        return extractedPath;
    }

    async extractFiles(sourcePath: string, destinationPath: string) {
        const files = fs.readdirSync(sourcePath);

        for (const file of files) {
            const currentPath = path.join(sourcePath, file);
            const destination = path.join(destinationPath, file);

            if (fs.lstatSync(currentPath).isDirectory()) {
                this.mkdir(destination);
                await this.extractFiles(currentPath, destination);
            } else {
                fs.copyFileSync(currentPath, destination);
            }
        }
    }

    private async downloadFile(downloadUrl: string, downloadPath: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const file = fs.createWriteStream(downloadPath);

            https.get(downloadUrl, (response) => {
                response.pipe(file);

                response.on('error', (error) => {
                    console.error('发生错误：', error);
                    reject(error);
                });

                response.on('end', () => {
                    resolve();
                });
            });
        });
    }

    private async unzipFile(downloadPath: string, extractPath: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            fs.createReadStream(downloadPath)
                .pipe(unzipper.Extract({ path: extractPath }))
                .on('finish', () => {
                    resolve();
                })
                .on('error', (error) => {
                    console.error('发生错误：', error);
                    reject(error);
                });
        });
    }

    async downloadFirefox(thepath: string) {
        if (fs.existsSync(thepath)) {
            console.log('文件存在')
            return;
        }

        const folder = 'firefox-1424';
        const downloadUrl = 'https://playwright.azureedge.net/builds/firefox/1424/firefox-win64.zip';
        const extractedPath = this.toPath(thepath);
        const targetFolder = this.mkdir(extractedPath);
        const downloadPath = path.join(targetFolder, 'firefox.zip');

        await this.downloadFile(downloadUrl, downloadPath);

        const extractPath = path.join(targetFolder, folder);
        fs.mkdirSync(extractPath);

        await this.unzipFile(downloadPath, extractPath);

        console.log('文件下载并解压完成。');
    }
}
