import axios, { AxiosRequestConfig } from "axios";
export class BiliBiliApi
{


    /**
     * 主要获取Bangumi的url
     * @param ep bilibili ep
     * @param biliBiliSessData BiliBili SessData
     * @param biliBiliqn BiliBiliqn
     * @returns 
     */
    public async getBangumiStream(ep: number, biliBiliSessData: string, biliBiliqn: number)
    {
        const url = 'https://api.bilibili.com/pgc/player/web/playurl';

        const params = new URLSearchParams({
            ep_id: ep.toString(),
            qn: biliBiliqn.toString(),
            fnval: '1',
            fourk: '1',
            fnver: '0',
        });

        const headers = this.returnBilibiliHeaders(biliBiliSessData);

        const config: AxiosRequestConfig = {
            method: 'get',
            url: `${url}?${params.toString()}`,
            headers: headers,
            withCredentials: true, // 模拟 'credentials: 'include''
        };


        const response = await axios(config);
        const responseData = response.data as bangumiStream;

        if (responseData.code === 0)
        {
            return responseData;
        } else
        {
            throw new Error(responseData.message);
        }

    }

    public async getBangumiStreamFromFunctionCompute(ep: number, biliBiliSessData: string, biliBiliqn: number, remoteUrl: string)
    {
        const url = remoteUrl + '/GetBiliBiliBangumiStream';
        const params = {
            ep_id: ep.toString(),
            qn: biliBiliqn.toString(),
            sessdata: biliBiliSessData
        };


        const response = await axios.post(url, params, {
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const responseData = response.data as bangumiStream;

        if (responseData.code === 0)
        {
            return responseData;
        } else
        {
            throw new Error(responseData.message);
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

        const config: AxiosRequestConfig = {
            method: 'get',
            url: `${url}?${params.toString()}`,
            headers: headers,
            withCredentials: true, // 模拟 'credentials: 'include''
        };


        const response = await axios(config);
        const data = response.data as BangumiVideoDetail;

        if (data.code === 0)
        {
            return data.result;
        } else
        {
            return null;
        }

    }

    public async getBilibiliVideoData(bvid: string, biliBiliSessData: string)
    {
        const url = 'https://api.bilibili.com/x/web-interface/view';
        const params = new URLSearchParams({
            bvid: bvid
        });

        const headers = this.returnBilibiliHeaders(biliBiliSessData);

        const config: AxiosRequestConfig = {
            method: 'get',
            url: `${url}?${params.toString()}`,
            headers: headers,
            withCredentials: true, // 模拟 'credentials: 'include''
        };


        const response = await axios(config);
        const data = response.data as BVideoDetail;

        if (data.code === 0)
        {
            return data.data;
        } else
        {
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

        const config: AxiosRequestConfig = {
            headers: headers,
            withCredentials: true, // 模拟 'credentials: 'include''
        };

        const response = await axios.get(`${url}?${params.toString()}`, config);
        const data: BVideoStream = response.data;

        if (data.code === 0)
        {
            return data;
        } else
        {
            console.error('Error:', data.message);
            throw new Error(`Error: ${data.message}`);
        }

    }


    public async getBilibiliVideoStreamFromFunctionCompute(avid: string, bvid: string, cid: string, biliBiliSessData: string, biliBiliPlatform: string, biliBiliqn: number, remoteUrl: string)
    {
        const url = remoteUrl + '/GetBiliBiliVideoStream';
        const params = {
            bvid: bvid,
            avid: avid,
            cid: cid,
            qn: biliBiliqn.toString(),
            platform: biliBiliPlatform,
            sessdata: biliBiliSessData
        };

        const config: AxiosRequestConfig = {
            method: 'post',
            url: url,
            headers: {
                'Content-Type': 'application/json',
            },
            data: params,
        };


        const response = await axios(config);
        const data: BVideoStream = response.data;

        if (data.code === 0)
        {
            return data;
        } else
        {
            console.error('Error:', data.message);
            throw new Error(`Error: ${data.message}`);
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