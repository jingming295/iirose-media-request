
export class ErrorHandle{
    async ErrorHandle(ErrorMsg) {

        switch(ErrorMsg){
            case ErrorMsg.includes("Executable doesn't exist"):
                return '没有发现playwright需要的游览器'
            break

            case ErrorMsg.includes("GLIBCXX"):
                return '没有发现需要的libstdc++ 库'
            break

            default:
                return ErrorMsg
            break
        }
        
        return ErrorMsg
    }

}