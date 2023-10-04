import * as fs from 'fs';
import * as https from 'https';
import unzipper from 'unzipper';
import * as path from 'path';
import * as os from 'os';
import { mkdirp } from 'mkdirp';
import { Logger } from 'koishi'

export class DownloadBrowser {
    private async mkdir(targetFolder: string) {
        await mkdirp(targetFolder)
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
                .on('finish', async () => {
                    resolve();
                })
                .on('error', (error) => {
                    console.error('发生错误：', error);
                    reject(error);
                });
        });
    }

    private async addExecutePermission(filePath: string) {
        return new Promise<void>((resolve, reject) => {
          fs.chmod(filePath, 0o755, (err) => {
            if (err) {
              console.error('添加可执行权限失败:', err);
              reject(err);
            } else {
              console.log('成功添加可执行权限');
              resolve();
            }
          });
        });
      }

    async downloadFirefox() {
        const logger = new Logger('iirose-media-request')
        let firefoxPath = '/firefox/firefox'
        const playwrightPath = path.join(os.homedir(), 'playwright')
        firefoxPath = path.join(playwrightPath, firefoxPath)
        const platform = os.platform();
        let downloadUrl:string
        if(platform === 'win32'){
            firefoxPath += '.exe'
            downloadUrl = 'https://playwright.azureedge.net/builds/firefox/1424/firefox-win64.zip';
        } else if (platform === 'linux') {
            downloadUrl = 'https://playwright.azureedge.net/builds/firefox/1424/firefox-ubuntu-22.04.zip';
        } else return null


        if (fs.existsSync(firefoxPath)) {
            logger.info(`游览器文件存在${firefoxPath}`)
            return firefoxPath;
        }
        
        const targetFolder = await this.mkdir(playwrightPath);
        const downloadPath = path.join(targetFolder, 'firefox.zip');
        logger.info(`downloadPath: ${downloadPath}`)
        logger.info(`targetFolder: ${targetFolder}`)
        logger.info(`downloadUrl: ${downloadUrl}`)
        await this.downloadFile(downloadUrl, downloadPath);
        await this.unzipFile(downloadPath, playwrightPath);
        if(platform === 'linux') await this.addExecutePermission(firefoxPath)

        logger.info(`游览器文件下载并解压完成`)
        return firefoxPath
    }
}