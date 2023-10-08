import { Schema } from "koishi";
export interface Config { }

/**
 * @description 设置配置
 */
export const Config: Schema<Config> = Schema.intersect([
  Schema.object({
    timeOut: Schema.number().role('slider').min(1000).max(100000).default(30000).description('等待页面加载的超时时长'),
    waitTime: Schema.number().role('slider').min(100).max(50000).default(3000).description('页面加载完成后的等待时间'),
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
    ]).default(80).description('视频的清晰度，拉到的视频播不出来就切16，具体看https://github.com/SocialSisterYi/bilibili-API-collect/blob/master/docs/video/info.md'),
    platform: Schema.union([
      Schema.const('pc'),
      Schema.const('html5'),
    ]).default('html5').description('对Bangumi无效，pc能获得最高1080p的视频，html5能获得最高720p的视频。如果pc拿不到视频链接，或者视频链接不可用的话，就用html5'),
  }).description('bilibili视频相关设置'),
  Schema.object({
    mediaCardColor: Schema.string().default('FFFFFF').description('艾特媒体的时候的媒体卡片颜色，使用HEX，不需要#, 具体参考https://www.sojson.com/web/panel.html'),
    noHentai: Schema.boolean().default(true).description('是否禁止抓取涩涩网站'),
    trackUser: Schema.boolean().default(false).description('机器人是否说明是谁点播的视频（以确保他人点播违规视频的时候有证据）'),
  }).description('点视频的相关设置')

]);