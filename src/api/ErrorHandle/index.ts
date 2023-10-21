
/**
 * @description 处理错误
 */
export class ErrorHandle
{
    /**
     * @description 处理错误
     * @param ErrorMsg 错误信息
     * @return string
     */
    ErrorHandle(ErrorMsg: string)
    {

        let returnMsg: string | null = null;
        ([{
            inc: ["Executable doesn't exist"],
            fn: () =>
            {
                return '<>没有发现playwright需要的游览器</>';
            }
        }, {
            inc: ["GLIBCXX"],
            fn: () =>
            {
                return `<>系统尝试寻找 GLIBCXX_3.4.20 和 GLIBCXX_3.4.21 的版本，但未能找到，请手动安装！</>`;
            }
        }, {
            inc: ["SSL_ERROR"],
            fn: () =>
            {
                return `<>此网站的证书有问题，无法获取媒体链接</>`;
            }
        }, {
            inc: ["ERR_CERT_AUTHORITY_INVALID"],
            fn: () =>
            {
                return `<>此网站的证书有问题，无法获取媒体链接</>`;
            }
        }, {
            inc: ["page has been closed"],
            fn: () =>
            {
                return `
                <>
                <parent>
                页面被关闭<child/>
                可能的原因：<child/>
                CPU占用达到设定的阈值（可能去到挖矿页面了）<child/>
                </parent>
                </>
                `;
            }
        }, {
            inc: ["Timeout"],
            fn: () =>
            {
                return `<>访问网站超时</>`;
            }
        }]).some(o =>
        {
            if (o.inc.every(k => ErrorMsg.includes(k)))
            {
                returnMsg = o.fn();
                return true;
            }
            else
                return false;
        });

        if (!returnMsg)
        {
            console.log(ErrorMsg);
            returnMsg === ErrorMsg;
            return ErrorMsg;
        }
        else
            return returnMsg;
    }
}