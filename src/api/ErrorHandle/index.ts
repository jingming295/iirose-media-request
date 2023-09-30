

export class ErrorHandle{
    async ErrorHandle(ErrorMsg) {

        switch (true) {
            case ErrorMsg.includes("Executable doesn't exist"):
                return '<>没有发现playwright需要的游览器</>';
            case ErrorMsg.includes("GLIBCXX"):
                return `<>系统尝试寻找 GLIBCXX_3.4.20 和 GLIBCXX_3.4.21 的版本，但未能找到，请手动安装！</>`
            case ErrorMsg.includes("SSL_ERROR"):
                return `<>此网站的证书有问题，无法获取媒体链接</>`
            case ErrorMsg.includes("Timeout"):
                return `<>访问网站超时</>`
            default:
                console.log(ErrorMsg);
                return ErrorMsg;
        }
    }

}