import axios from 'axios';

export class BiliBiliApi
{
    /**
     * 主要获取Bangumi的url
     * @param ep bilibili ep
     * @param biliBiliSessData BiliBili SessData
     * @param biliBiliqn BiliBiliqn
     * @returns 
     */
    public async getBangumiStream(ep: number, biliBiliSessData: string, biliBiliqn: number, platform: string)
    {
        const url = 'https://api.bilibili.com/pgc/player/web/playurl';
        const params = new URLSearchParams({
            ep_id: ep.toString(),
            qn: biliBiliqn.toString(),
            fnval: '1',
            fourk: '1',
            high_quality: '1',
            platform: platform
        });

        const headers = this.returnBilibiliHeaders(biliBiliSessData);

        try
        {
            const response = await axios.get(`${url}?${params.toString()}`, {
                headers: headers,
                withCredentials: true // 这里模拟了 'credentials: 'include'' 的效果
            });

            if (response.status === 200)
            {
                const responseData = response.data as bangumiStream;
                if (responseData.code === 0)
                {
                    return responseData.result;
                } else
                {
                    throw new Error(responseData.message);
                }
            } else
            {
                throw new Error(`Network response was not ok: ${response.statusText}`);
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
        const params = new URLSearchParams({
            ep_id: ep.toString()
        });
        const headers = this.returnBilibiliHeaders(biliBiliSessData);

        try
        {
            const response = await axios.get(`${url}?${params.toString()}`, {
                headers: headers,
                withCredentials: true // 这里模拟了 'credentials: 'include'' 的效果
            });

            if (response.status === 200)
            {
                const data = response.data as BangumiVideoDetail;
                if (data.code === 0)
                {
                    return data.result;
                } else
                {
                    return null;
                }
            } else
            {
                console.error('Error:', response.status);
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
        const params = new URLSearchParams({
            bvid: bvid
        });
        const headers = this.returnBilibiliHeaders(biliBiliSessData);

        try
        {
            const response = await axios.get(`${url}?${params.toString()}`, {
                headers: headers,
                withCredentials: true // 这里模拟了 'credentials: 'include'' 的效果
            });

            if (response.status === 200)
            {
                const data = response.data as BVideoDetail;
                if (data.code === 0)
                {
                    return data.data;
                } else
                {
                    return null;
                }
            } else
            {
                console.error('Error:', response.status);
                return null;
            }
        } catch (error)
        {
            console.error('Error:', (error as Error).message);
            return null;
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
        const params = new URLSearchParams({
            bvid: bvid,
            avid: avid,
            cid: cid,
            qn: biliBiliqn.toString(),
            fnval: (1 | 128).toString(),
            fourk: '1',
            platform: biliBiliPlatform,
            high_quality: '1'
        });
        const headers = this.returnBilibiliHeaders(biliBiliSessData);
        const response = await axios.get(`${url}?${params.toString()}`, {
            headers: headers,
            withCredentials: true // 这里模拟了 'credentials: 'include'' 的效果
        });

        if (response.status === 200)
        {
            const data: BVideoStream = response.data as BVideoStream;
            if (data.code === 0)
            {
                return data;
            } else
            {
                console.error('Error:', data.message);
                throw new Error(`Error: ${data.message}`);
            }
        } else
        {
            console.error('Error:', response.status);
            throw new Error(`Error: ${response.status}`);
        }
    }


    private returnBilibiliHeaders(biliBiliSessData: string)
    {
        const headers = {
            Cookie: `SESSDATA=${biliBiliSessData};`,  // 你的SESSDATA
            referer: 'https://www.bilibili.com',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36'
        };
        return headers;
    }
}