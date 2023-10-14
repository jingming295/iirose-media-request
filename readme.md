<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://github.com/initialencounter/mykoishi">
    <a href="https://koishi.chat/" target="_blank">
    <img width="160" src="https://koishi.chat/logo.png" alt="logo">
  </a>
  </a>

<h3 align="center">koishi-plugin-iirose-media-request</h3>

  <p align="center">
    使koishi机器人能够在[IIROSE-蔷薇花园](https://www.iirose.com) 聊天平台@任何视频和歌曲
  </p>
</div>

[![npm](https://img.shields.io/npm/v/koishi-plugin-iirose-media-request?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-iirose-media-request)


# 🎉隆重介绍，万能的适用全平台的点播媒体插件

## [IIROSE-MEDIA-REQUEST](https://github.com/jingming295/koishi-plugin-iirose-media-request)

***

## 📝简介
以koishi为基础的机器人，装了这个插件后，能帮你嗅探任何网站上面的资源（虽然还有很多bug）

***

## ✨功能1 @视频

**在iirose的任意房间（需要有Koishi机器人装这个插件），或者私聊机器人打 “a 视频网址”**

例子1：`a https://www.example.com`

例子2：`       a https://www.example.com` 

例子3：`a       https://www.example.com`

例子4：`       a       https://www.example.com`

**如果是b站视频，你也可以这样**

例子1：`a 【【甘城なつき】猫猫惨叫！】 https://www.bilibili.com/video/BV1Yw411c7cC/?share_source=copy_web`

例子2：`a BV1Bx411K7Dd` 

## 🔍效果

![替代文本](http://r.iirose.com/i/23/10/8/11/5729-OG.png)

![替代文本](http://r.iirose.com/i/23/10/8/12/0000-1I.png)

![替代文本](http://r.iirose.com/i/23/10/8/12/0310-S2.png)

![替代文本](http://r.iirose.com/i/23/10/8/12/1225-MQ.png)

![替代文本](http://r.iirose.com/i/23/10/8/12/1447-HJ.png)

![替代文本](http://r.iirose.com/i/23/10/8/12/1936-I2.png)

![替代文本](http://r.iirose.com/i/23/10/8/12/2015-WL.png)

![替代文本](http://r.iirose.com/i/23/10/8/12/3801-IB.png)

![替代文本](http://r.iirose.com/i/23/10/8/12/3937-OL.png)

## ✨功能2 只获取直链

**在iirose的任意房间（需要有Koishi机器人装这个插件），或者私聊机器人打 “a --link 视频网址”**

例子1：`a --link https://www.example.com`

例子2：`a --link 【【甘城なつき】猫猫惨叫！】 https://www.bilibili.com/video/BV1Yw411c7cC/?share_source=copy_web`

例子3：`a --link BV1Bx411K7Dd` 

## 🔍效果

![替代文本](http://r.iirose.com/i/23/10/8/13/1633-8P.png)

## ✨功能3 获取视频的各种信息

**在iirose的任意房间（需要有Koishi机器人装这个插件），或者私聊机器人打 “a --data 视频网址”**

例子1：`a --data https://www.example.com`

例子2：`a --data 【镇魂街 第一季：第1话 镇魂街】 https://www.bilibili.com/bangumi/play/ep86866/?share_source=copy_web`

例子3：`a --data BV1Bx411K7Dd` 

## 🔍效果

![替代文本](http://r.iirose.com/i/23/10/8/13/2010-SV.png)

***

## 📦安装和使用方法

### 下载并且安装Koishi机器人服务：


**步骤1：前往https://koishi.chat/zh-CN/manual/starter/ 下载Koishi机器人**

**步骤2：启动koishi机器人服务**

**步骤3：在弹出的koishi控制台，前往依赖管理（在页面左侧的第四个按钮）**

**步骤4：点击全部更新，然后点击应用更改（在页面的顶部右侧）**

***

### 在Koishi机器人服务安装插件



**步骤1：前往插件市场（在页面左侧的第三个按钮）**

**步骤2：搜索adapter-iirose**

**步骤3：点击安装，选择最新版**

**步骤4：前往插件市场（在页面左侧的第三个按钮）**

**步骤5：搜索puppeteer**

**步骤6：点击安装，选择最新版**

**步骤7：前往插件市场（在页面左侧的第三个按钮）**

**步骤8：搜索iirose-media-request**

**步骤9：点击安装，选择最新版**

***

### 启用并且配置服务器插件



**步骤1：前往插件配置（在页面左侧的第二个按钮）**

**步骤2：在分组：develop 选择 adapter-iirose （在页面左侧）**

**步骤3：输入你的机器人 用户名， uid（唯一标识）， password（你的密码转换成32位md5），roomid（房间的地址）**

**附加：密码转md5可以去 [MD5在线加密/解密](https://www.sojson.com/md5/)**

**步骤4：点击保存配置和启用插件（在页面顶部）**

**步骤5：前往插件配置（在页面左侧的第二个按钮）**

**步骤6：在分组：develop 选择 puppeteer（在页面左侧）**

**步骤7：点击启用插件（在页面顶部）**

**步骤8：前往插件配置（在页面左侧的第二个按钮）**

**步骤9：在分组：develop 选择 iirose-media-request（在页面左侧）**

**可选步骤：输入你的bilibili SESSDATA, 实在不会就问 [*铭铭.*] **

**附加：SESSDATA的获得方式可以看 [爱发电：bilibili获取sessdata](https://afdian.net/album/b80ef61c626411ea93f352540025c377/b341d694d72c11ea96c952540025c377) [B站：【补充】关于如何获取SESSDATA的方法](https://www.bilibili.com/read/cv12349604/)**

**步骤10：点击保存配置和启用插件（在页面顶部）**

***

## 🤚🏻免责

**本插件仅供学习，原理和真实的游览器以及devtools类似，没有针对任何一家网站进行解密操作，用户的操作与插件无关，请注意资源的权限和版权，请在下载插件后24小时内删除。**

***

## 💝鸣谢

[koishi](https://koishi.chat/)

[koishi-plugin-adapter-iirose](https://github.com/BSTluo/koishi-plugin-adapter-iirose)

[koishi-plugin-puppeteer](https://github.com/koishijs/koishi-plugin-puppeteer)

[get-video-duration](https://www.npmjs.com/package/get-video-duration)

[jimp](https://www.npmjs.com/package/jimp)

[axios](https://www.npmjs.com/package/axios)

[os](https://www.npmjs.com/package/os)

[bilibili-API-collect](https://github.com/SocialSisterYi/bilibili-API-collect)

 [*春风萧落☾.‎˖٭𓂃*] 
 
 [*QwQ～*] 
 
 [*落零レ*] 

***

## 🐛Bug反馈

**如果发现bug可以去[koishi-plugin-iirose-media-request](https://github.com/jingming295/koishi-plugin-iirose-media-request/issues)开Issues**

***

## 🙇

**这个插件真的很好用，求求你们用啦**

***

## 👀关注我们

**[REIFUU-前哨站](https://forum.reifuu.icu/)**

***

## 📜License

**MIT license**
