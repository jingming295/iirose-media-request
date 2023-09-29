

export class ErrorHandle{
    async ErrorHandle(ErrorMsg) {

        switch (true) {
            case ErrorMsg.includes("Executable doesn't exist"):
                return '<>没有发现playwright需要的游览器</>';
            case ErrorMsg.includes("GLIBCXX"):
                return `
                <>
                系统尝试寻找 GLIBCXX_3.4.20 和 GLIBCXX_3.4.21 的版本，但未能找到，请手动安装！
                </>
                `
            default:
                console.log(ErrorMsg);
                return ErrorMsg;
        }
    }

}