

import { eapi, weapi } from './crypto';
// import fs from 'fs'
export class NeteaseApi
{
  async getNeteaseMusicSearchData(keyWord: string)
  {
      const url = 'https://music.163.com/weapi/search/get';
      const params: ParamsObject = {
          s: keyWord, // 关键词
          type: 1,
          limit: 10, // 返回歌曲数量
          offset: 0, // 偏移量
      };
  
      const encryptParam = new URLSearchParams(weapi(params)).toString();
      const headers = {
      };
  
      try
      {
          const response = await fetch(url, {
              method: 'POST',
              headers,
              body: encryptParam
          });
          if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
          }
          return await response.json();
      } catch (error)
      {
          console.log(`error response: ${(error as Error)}`);
          return null;
      }
  }
  

  async getNeteaseMusicDetail(id: number)
  {
      const url = new URL(`http://music.163.com/api/song/detail`);
      const params = {
          id: id.toString(),
          ids: `[${id}]`
      };
      url.search = new URLSearchParams(params).toString();
      const headers = {
      };
      try
      {
          const response = await fetch(url.toString(), { headers });
          if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
          }
          const MusicDetail: MusicDetail = await response.json();
          return MusicDetail;
      } catch (error)
      {
          console.error('获取音乐详情失败', error);
      }
  }
  

  async getSongResource(id: number)
  {
      const url = new URL(`https://v.iarc.top/`);
      const params = {
          type: 'song',
          id: id.toString()
      };
      url.search = new URLSearchParams(params).toString();
      const headers = {
      };
      try
      {
          const response = await fetch(url.toString(), { headers });
          if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
          }
          return await response.json();
      } catch (error)
      {
          console.error('获取歌曲资源失败', error);
          return null;
      }
  }
  

  async getAlbumSimpleDetail(id: number)
  {
      const url = `https://music.163.com/eapi/rep/ugc/album/get`;
  
      const params: SearchSimpleAlbumParamsObject = {
          albumId: id,
          header: {
              appver: "8.9.70",
              versioncode: "140",
              buildver: Date.now().toString().substr(0, 10),
              resolution: "1920x1080",
              __csrf: "",
              os: "android",
              requestId: `${Date.now()}_${Math.floor(Math.random() * 1000)
                  .toString()
                  .padStart(4, '0')}`,
              MUSIC_A: "1f5fa7b6a6a9f81a11886e5186fde7fba2b2ea2f218a30492fbed9df02a2710dadd2bc8204eeee5e66293feeceb970e5a11ec9f20521fd5210722d253c67f6e9fac900d7a89533ee3324751bcc9aaf44c3061cd18d77b7a0"
          }
      };
  
      const encryptParam = new URLSearchParams(eapi(`/api/rep/ugc/album/get`, params)).toString();
      const headers = {
          "User-Agent": "Mozilla/5.0 (Linux; U; Android 8.1.0; zh-cn; BKK-AL10 Build/HONORBKK-AL10) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/66.0.3359.126 MQQBrowser/10.6 Mobile Safari/537.36",
          "Content-Type": "application/x-www-form-urlencoded",
          Referer: "https://music.163.com",
          "X-Real-IP": "::1",
          "X-Forwarded-For": "::1",
          Cookie: "osver=undefined; deviceId=undefined; appver=8.9.70; versioncode=140; mobilename=undefined; buildver=1697745346; resolution=1920x1080; __csrf=; os=android; channel=undefined; requestId=1697745346367_0886; MUSIC_A=1f5fa7b6a6a9f81a11886e5186fde7fb0b63372bce7ff361fa5cb1a86d5fbbbbadd2bc8204eeee5e04bf7bf7e7f4428eeb3a754c1a3a779110722d253c67f6e9fac900d7a89533ee3324751bcc9aaf44c3061cd18d77b7a0"
      };
      try
      {
          const response = await fetch(url, {
              method: 'POST',
              headers,
              body: encryptParam
          });
          if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
          }
          const albumData: Album = await response.json();
          return albumData;
      } catch (error)
      {
          throw new Error('getAlbumSimpleDetail：获取专辑失败');
      }
  }
  

  async getSonglistDetail(id: number) {
    const url = 'https://music.163.com/api/v6/playlist/detail';
    const params = new URLSearchParams({
      id: id.toString(),
      n: '100000',
      s: '8'
    });
  
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Linux; U; Android 8.1.0; zh-cn; BKK-AL10 Build/HONORBKK-AL10) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/66.0.3359.126 MQQBrowser/10.6 Mobile Safari/537.36',
      'Content-Type': 'application/x-www-form-urlencoded',
      Referer: 'https://music.163.com',
      'X-Real-IP': '::1',
      'X-Forwarded-For': '::1',
      Cookie: 'osver=undefined; deviceId=undefined; appver=8.9.70; versioncode=140; mobilename=undefined; buildver=1697745346; resolution=1920x1080; __csrf=; os=android; channel=undefined; requestId=1697745346367_0886; MUSIC_A=1f5fa7b6a6a9f81a11886e5186fde7fb0b63372bce7ff361fa5cb1a86d5fbbbbadd2bc8204eeee5e04bf7bf7e7f4428eeb3a754c1a3a779110722d253c67f6e9fac900d7a89533ee3324751bcc9aaf44c3061cd18d77b7a0'
    };
  
    try {
      const response = await fetch(url, {
        method: 'POST',
        body: params,
        headers: headers
      });
  
      if (!response.ok) {
        throw new Error('getSonglistSimpleDetail：歌单失败');
      }
  
      const songListData = await response.json();
      return songListData;
    } catch (error) {
      console.error(error);
    }
  }
  
}