import { Schema } from "koishi";
export interface Config
{
  timeOut: number;
  waitTime: number;
  functionCompute: boolean;
  functionCompureAddress: { area: string; url: string; }[];
  queueRequest: boolean;
  mediaCardColor: string;
  noHentai: boolean;
  trackUser: boolean;
  detectUpdate: boolean;
  maxCpuUsage: number;
  privateMsg: boolean;
  LiveDuration:number
}

/**
 * @description 设置配置
 */
export const Config: Schema<Config> = Schema.intersect([
  Schema.object({
    timeOut: Schema.number().role('slider').min(1000).max(100000).default(30000).description('等待页面加载的超时时长'),
    waitTime: Schema.number().role('slider').min(100).max(50000).default(2000).description('页面加载完成后的等待时间'),
  }).description('游览器页面相关设置'),
  Schema.object({
    LiveDuration: Schema.number().min(1).max(Number.MAX_SAFE_INTEGER).default(18000).description('直播视频的时长(秒), 直接拉满就是**2亿8千万多年**'),
    functionCompute: Schema.boolean().default(false).description('是否使用阿里云函数计算来获取视频流媒体(仅在原版策略视频流无法播放的时候开启)'),
    functionCompureAddress: Schema.array(Schema.object({
      area: Schema.string().description('函数计算的地区'),
      url: Schema.string().description('函数计算的网址')
    })).default([{'area': '香港', 'url': 'https://bilibileostream-bilibilih-srrmdnstep.cn-hongkong.fcapp.run'}, {'area': '深圳', 'url': 'https://bilibileostream-guide-ihnotpwqoe.cn-shenzhen.fcapp.run'}])
    .description('阿里云函数计算的地址，如果有多个，将会选择第一个(仅在functionCompute开启时有用，请选择最靠近你的地理位置，你也可以自己创建自己的云函数，详情: https://github.com/jingming295/BiliBiliStreamRequest)'),
  }).description('bilibili视频相关设置'),
  Schema.object({
    queueRequest: Schema.boolean().default(false).description('针对专辑或者歌单是否排队点播，这是因为网易云的直链好像只能持续30分钟'),
  }).description('网易云相关设置'),
  Schema.object({
    mediaCardColor: Schema.string().default('FFFFFF').description('艾特媒体的时候的媒体卡片颜色，使用HEX，不需要#, 具体参考https://www.sojson.com/web/panel.html'),
    noHentai: Schema.boolean().default(true).description('是否禁止抓取涩涩网站'),
    trackUser: Schema.boolean().default(false).description('机器人是否说明是谁点播和cut的视频（以确保他人点播违规视频的时候有证据）'),
    detectUpdate: Schema.boolean().default(true).description('是否检测本插件更新，打开的话，如果检测到不是最新版，机器人将提示'),
    maxCpuUsage: Schema.number().role('slider').min(0.01).max(1).step(0.01).default(0.95).description('cpu使用阈值，如果超过的话，就关掉page。这个设置是为了防范挖矿网页'),
    privateMsg: Schema.boolean().default(true).description('是否允许私聊点播')
  }).description('插件的相关设置')

]);