
import { AlbumData } from './AlbumInterface';
import { weapi } from './crypto';
import axios from 'axios';
import { MusicDetail, SongList, xcSongResource } from './interface';
import { Lyric } from './LyricInterface';
import { NeteaseComment } from './CommentInterface';
export class NeteaseApi
{
    async getNeteaseMusicSearchData(keyWord: string)
    {
        const url = 'https://music.163.com/weapi/search/get';
        const params = {
            s: keyWord, // 关键词
            type: 1,
            limit: 10, // 返回歌曲数量
            offset: 0, // 偏移量
        };
        const we = weapi(params);
        const a = {
            params: we.params,
            encSecKey: we.encSecKey
        }
        // const encryptParam = new URLSearchParams(weapi(params)).toString();
        const encryptParam = new URLSearchParams(we);
        // console.log(encryptParam);
        const response = await axios.post(url, we, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        return response.data;

    }

    async getNeteaseMusicDetail(id: number)
    {
        const url = new URL(`http://music.163.com/api/song/detail`);
        const params = {
            id: id.toString(),
            ids: `[${id}]`
        };
        url.search = new URLSearchParams(params).toString();


        const response = await axios.get(url.toString(), {
            headers: this.returnHeader()
        });

        const musicDetail: MusicDetail = response.data;

        return musicDetail;

    }


    async getSongResource(
        id: number,
        level: 'standard' | 'higher' | 'exhigh' | 'lossless' | 'hires' | 'jyeffect' | 'sky' | 'jymaster' = 'exhigh',
        type:number=302
        )
    {
        // const url = new URL(`https://v.iarc.top/`);
        // const params = {
        //     type: 'song',
        //     id: id.toString()
        // };
        const url = new URL(`https://xc.null.red:8043/meting-api/`);
        const params = {
            id: id.toString(),
            level: level,
            type: type.toString()
        };
        url.search = new URLSearchParams(params).toString();

        const response = await axios.get(url.toString(), {
            headers: this.returnHeader()
        });
        return response.data as xcSongResource;

    }

    async getComment(id: number){
        const url = `https://xc.null.red:8043/api/netease/comment/music`;
        const params = {
            id: id.toString(),
            limit: '1'
        }
        const fullUrl = `${url}?${new URLSearchParams(params).toString()}`
        const response = await fetch(fullUrl, {
            method: 'GET',
        });
        if(response.ok){
            const data:NeteaseComment = await response.json();
            return data;
        }
        return null;
    }



    async getAlbumData(id: number)
    {
        const url = `https://music.163.com/weapi/v1/album/${id}`;

        const params = {
            csrf_token: "",
        };

        const encryptParam = new URLSearchParams(weapi(params)).toString();


        const response = await axios.post(url, encryptParam, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Linux; U; Android 8.1.0; zh-cn; BKK-AL10 Build/HONORBKK-AL10) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/66.0.3359.126 MQQBrowser/10.6 Mobile Safari/537.36",
                "Content-Type": "application/x-www-form-urlencoded",
                Referer: "https://music.163.com",
                "X-Real-IP": "::1",
                "X-Forwarded-For": "::1",
                Cookie: "osver=undefined; deviceId=undefined; appver=8.9.70; versioncode=140; mobilename=undefined; buildver=1697745346; resolution=1920x1080; __csrf=; os=android; channel=undefined; requestId=1697745346367_0886; MUSIC_A=1f5fa7b6a6a9f81a11886e5186fde7fb0b63372bce7ff361fa5cb1a86d5fbbbbadd2bc8204eeee5e04bf7bf7e7f4428eeb3a754c1a3a779110722d253c67f6e9fac900d7a89533ee3324751bcc9aaf44c3061cd18d77b7a0"
            }
        });
        const data = response.data as AlbumData;
        return data;

    }


    async getSonglistDetail(id: number)
    {
        const url = 'https://music.163.com/api/v6/playlist/detail';
        const params = new URLSearchParams({
            id: id.toString(),
            n: '100000',
            s: '8'
        });


        const response = await axios.post(url, params, {
            headers: this.returnHeaderV2()
        });

        if (response.status !== 200)
        {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.data as SongList;

    }

    async getLyric(id: number)
    {
        const url = 'https://music.163.com/api/song/lyric';
        const params = new URLSearchParams({
            id: id.toString(),
            tv: '-1',
            lv: '-1',
            kv: '-1',
            rv: '-1'
        });

        const response = await axios.post(url, params, {
            headers: this.returnHeaderV2()
        });

        if (response.status !== 200)
        {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.data as Lyric;
    }

    private returnHeader()
    {
        return {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
            'Content-Type': 'application/json'
        };
    }

    private returnHeaderV2()
    {
        return {
            'User-Agent': 'Mozilla/5.0 (Linux; U; Android 8.1.0; zh-cn; BKK-AL10 Build/HONORBKK-AL10) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/66.0.3359.126 MQQBrowser/10.6 Mobile Safari/537.36',
            'Content-Type': 'application/x-www-form-urlencoded',
            Referer: 'https://music.163.com',
            'X-Real-IP': '::1',
            'X-Forwarded-For': '::1',
            Cookie: 'osver=undefined; deviceId=undefined; appver=8.9.70; versioncode=140; mobilename=undefined; buildver=1697745346; resolution=1920x1080; __csrf=; os=android; channel=undefined; requestId=1697745346367_0886; MUSIC_A=1f5fa7b6a6a9f81a11886e5186fde7fb0b63372bce7ff361fa5cb1a86d5fbbbbadd2bc8204eeee5e04bf7bf7e7f4428eeb3a754c1a3a779110722d253c67f6e9fac900d7a89533ee3324751bcc9aaf44c3061cd18d77b7a0'
        };
    }

}