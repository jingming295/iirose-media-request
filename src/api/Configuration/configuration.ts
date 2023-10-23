import { Schema } from "koishi";
export interface Config { }

/**
 * @description 设置配置
 */
export const Config: Schema<Config> = Schema.intersect([
  Schema.object({
    timeOut: Schema.number().role('slider').min(1000).max(100000).default(30000).description('等待页面加载的超时时长'),
    waitTime: Schema.number().role('slider').min(100).max(50000).default(2000).description('页面加载完成后的等待时间'),
  }).description('游览器页面相关设置'),
  Schema.object({
    SESSDATA: Schema.string().default('').description('bilibili的SESSDATA，在cookie获取，不填只能获取360p的视频，填了能获取1080p的视频'),
    qn: Schema.union([
      Schema.const(6),
      Schema.const(16),
      Schema.const(64),
      Schema.const(74),
      Schema.const(80),
      Schema.const(112).experimental(),
      Schema.const(116).experimental(),
      Schema.const(120).experimental(),
      Schema.const(125).experimental(),
      Schema.const(126).experimental(),
      Schema.const(127).experimental(),
    ]).default(80).description('视频的清晰度，具体看https://github.com/SocialSisterYi/bilibili-API-collect/blob/master/docs/video/info.md'),
    platform: Schema.union([
      Schema.const('pc'),
      Schema.const('html5'),
    ]).default('pc').description('平台，你不太需要碰，系统会自己调整'),
  }).description('bilibili视频相关设置'),
  Schema.object({
    queueRequest: Schema.boolean().default(false).description('针对专辑或者歌单是否排队点播，这是因为网易云的直链好像只能持续30分钟'),
  }).description('网易云相关设置'),
  Schema.object({
    mediaCardColor: Schema.string().default('FFFFFF').description('艾特媒体的时候的媒体卡片颜色，使用HEX，不需要#, 具体参考https://www.sojson.com/web/panel.html'),
    noHentai: Schema.boolean().default(true).description('是否禁止抓取涩涩网站'),
    trackUser: Schema.boolean().default(false).description('机器人是否说明是谁点播和cut的视频（以确保他人点播违规视频的时候有证据）'),
    detectUpdate: Schema.boolean().default(true).description('是否检测本插件更新，打开的话，如果检测到不是最新版，机器人将提示'),
    maxCpuUsage: Schema.number().role('slider').min(0.01).max(1).step(0.01).default(0.95).description('cpu使用阈值，如果超过的话，就关掉page。这个设置是为了防范挖矿网页')

  }).description('插件的相关设置')

]);