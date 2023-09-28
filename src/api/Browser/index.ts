import * as fs from 'fs';
import * as https from 'https';
import unzipper from 'unzipper';
import * as path from 'path';
import * as os from 'os';
import { mkdirp } from 'mkdirp'

export class DownloadBrowser {


    
    private mkdir(targetFolder: string) {
        if (!fs.existsSync(targetFolder)) {
            mkdirp(targetFolder)
        }
        return targetFolder;
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

    async downloadFirefox() {
        let firefoxPath = '/firefox/firefox.exe'
        const playwrightPath = path.join(os.homedir(), 'playwright')
        firefoxPath = path.join(playwrightPath, firefoxPath)
        console.log(`firefox path: ${firefoxPath}`)
        if (fs.existsSync(playwrightPath)) {
            console.log('文件存在')
            return;
        }
        console.log(`目标路径：${playwrightPath}`)

        const downloadUrl = 'https://playwright.azureedge.net/builds/firefox/1424/firefox-win64.zip';
        const targetFolder = this.mkdir(playwrightPath);
        const downloadPath = path.join(targetFolder, 'firefox.zip');

        await this.downloadFile(downloadUrl, downloadPath);

        await this.unzipFile(downloadPath, playwrightPath);

        console.log('文件下载并解压完成。');
        return firefoxPath
    }
}
