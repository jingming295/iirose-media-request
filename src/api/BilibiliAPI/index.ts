import axios from 'axios';
export class BiliBiliApi
{
    /**
     * 主要获取Bangumi的url
     * @param ep bilibili ep
     * @returns 
     */
    public async getBangumiStream(ep: number, biliBiliSessData: string, biliBiliqn: number)
    {
        const url = 'https://api.bilibili.com/pgc/player/web/playurl';
        const params = {
            ep_id: ep,
            qn: biliBiliqn,
            fnval: 1,
            fourk: 1,
            high_quality: 1
        };

        const headers = await {
            Cookie: `SESSDATA=${biliBiliSessData};`,  // 你的SESSDATA
            Referer: 'https://www.bilibili.com',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36'
        };

        try
        {
            const response = await axios.get(url, { params, headers });
            if (response.data.code === 0)
            {
                return response.data.result;
            } else
            {
                throw new Error(response.data.message);
            }
        } catch (error)
        {
            throw new Error((error as Error).message);
        }
    }

    /**
     * 主要获取Bangumi的各种信息
     * @param ep bilibili ep
     * @returns 
     */
    public async getBangumiData(ep: number, biliBiliSessData: string)
    {
        const url = 'https://api.bilibili.com/pgc/view/web/season';
        const params = {
            ep_id: ep
        };
        const headers = await {
            Cookie: `SESSDATA=${biliBiliSessData};`,  // 你的SESSDATA
            Referer: 'https://www.bilibili.com',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36'
        };

        try
        {
            const response = await axios.get(url, { params, headers });
            if (response.data.code === 0)
            {
                return response.data.result;
            } else
            {
                return null;
            }
        } catch (error)
        {
            console.error('Error:', (error as Error).message);
            return null;
        }

    }

    /**
    * 主要获取视频的各种信息
    * @param bvid bilibili bvid
    * @returns 
    */
     public async getBilibiliVideoData(bvid: string, biliBiliSessData: string)
    {
        const url = 'https://api.bilibili.com/x/web-interface/view';
        const params = {
            bvid: bvid
        };
        const headers = await {
            Cookie: `SESSDATA=${biliBiliSessData};`,  // 你的SESSDATA
            Referer: 'https://www.bilibili.com',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36'
        };

        try
        {
            const response = await axios.get(url, { params, headers });
            if (response.data.code === 0)
            {
                return response.data.data;
            } else
            {
                return null;
            }
        } catch (error)
        {
            console.error('Error:', (error as Error).message);
        }

    }

    /**
     * 主要获取视频的url
     * @param avid bilibili avid
     * @param bvid bilibili bvid
     * @param cid bilibili cid
     * @returns 
     */
    public async getBilibiliVideoStream(avid: string, bvid: string, cid: string, biliBiliSessData: string, biliBiliPlatform: string, biliBiliqn: number)
    {
        const url = 'https://api.bilibili.com/x/player/wbi/playurl';
        const params = {
            bvid: bvid,
            avid: avid,
            cid: cid,
            qn: biliBiliqn,
            fnval: 1 | 128,
            fourk: 1,
            platform: biliBiliPlatform,
            high_quality: 1
        };
        const headers = await {
            Cookie: `SESSDATA=${biliBiliSessData};`,  // 你的SESSDATA
            Referer: 'https://www.bilibili.com',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36'
        };

        try
        {
            const response = await axios.get(url, { params, headers });
            if (response.data.code === 0)
            {
                console.log(response.data.data)
                return response.data.data;
            } else
            {
                console.error('Error:', response.data.message);
            }
        } catch (error)
        {
            console.error('Error:', (error as Error).message);
        }
    }
}