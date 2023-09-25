
import { exec } from 'child_process';
export class ErrorHandle{
    async ErrorHandle(ErrorMsg) {
        if (ErrorMsg.includes("Executable doesn't exist")) {
            exec('yarn playwright install', (error, stdout, stderr) => {
                if (error) {
                    console.error(`Error during installation: ${error}`);
                    return `第一次执行，未发现游览器，安装失败: ${error}`;
                }
                console.log(`stdout: ${stdout}`);
                console.error(`stderr: ${stderr}`);
                return '第一次执行，未发现游览器，已安装，请重新输入命令';
            });
        }
        
        return ErrorMsg
    }

}