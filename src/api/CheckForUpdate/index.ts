import axios from 'axios';
interface UpdateInfo {
    latest: boolean;
    messageContent: string;
}

/**
 * 检测更新
 */
export class UpdateChecker {
    /**
     * 主要检查是不是最新版本
     * @returns 
     */
    public async checkForUpdates(): Promise<UpdateInfo> {
        const packageName = 'koishi-plugin-iirose-media-request';
        const currentVersion = require(`${packageName}/package.json`).version;
        const latestVersion = await this.getLatestVersion(packageName);

        if (latestVersion && currentVersion !== latestVersion) {
            return this.returnUpdateInfo(false, `当前 [${packageName}] 版本 (${currentVersion}) 不是最新版，最新版是 (${latestVersion}) ，请去插件市场或者依赖管理更新插件，如果你想要禁用更新检测，请去 插件管理 -> iirose-media-request 关闭 detectUpdate`);
        } else {
            return this.returnUpdateInfo(true, `当前${packageName}版本(${currentVersion})是最新版`);
        }
    }

    /**
     * 获取最新版
     * @param packageName 包名
     * @returns 
     */
     private async getLatestVersion(packageName: string): Promise<string | null> {
        try {
            const response = await axios.get(`https://registry.npmjs.org/${packageName}`);
            const data = response.data as NpmData;
            return data['dist-tags'].latest;
        } catch (error) {
            console.error('无法获取最新版本信息', error);
            return null;
        }
    }

    /**
     * 
     * @param latest 版本号
     * @param msg 信息
     * @returns info
     */
    private returnUpdateInfo(latest: boolean, msg: string): UpdateInfo {
        const info: UpdateInfo = {
            latest: latest,
            messageContent: msg,
        };
        return info;
    }
}
