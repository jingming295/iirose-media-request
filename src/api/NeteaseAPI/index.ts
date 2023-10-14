
import axios from 'axios';
import { weapi } from './crypto';
export class NeteaseApi
{

  async getNeteaseMusicSearchData(keyWord: string)
  {
    const url = 'https://music.163.com/weapi/search/get';
    const params:ParamsObject = {
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
      const response = await axios.post(url, encryptParam, {
        headers,
      });
      return response.data;
    } catch (error)
    {
      console.log(`error response: ${(error as Error)}`);
      return null;
    }
  }

  async getNeteaseMusicDetail(id: string)
  {
    const url = `http://music.163.com/api/song/detail`;
    const params = {
      id: id,
      ids: `[${id}]`
    };
    const headers = {
    };
    try
    {
      const response = await axios.get(url, { params, headers });
      return response.data;
    } catch (error)
    {
      console.error('获取音乐详情失败', error);
    }
  }

  async getSongResource(id: string)
  {
    const url = `https://v.iarc.top/?type=song&id=${id}`;
    const params = {
      type: 'song',
      id: id
    };
    const headers = {
      // 如果有需要的话，可以在这里添加请求头
    };

    try
    {
      const response = await axios.get(url, { params, headers });
      return response.data;
    } catch (error)
    {
      console.error('获取歌曲资源失败', error);
      return null;
    }
  }
}