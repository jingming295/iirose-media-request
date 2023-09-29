import { Schema } from "koishi";
export interface Config {}

export const Config: Schema<Config> = Schema.object({
    timeOut: Schema.number().role('slider').min(1000).max(100000).default(30000).description('等待页面加载的超时时长'),
    waitTime : Schema.number().role('slider').min(100).max(50000).default(3000).description('页面加载完成后的等待时间'),
}).description('游览器页面相关设置')