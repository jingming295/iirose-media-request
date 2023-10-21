import { MediaParsing } from ".";
import { NeteaseApi } from '../NeteaseAPI';
import { Session } from "koishi";

/**
 * 主要处理网易云的网站
 */
export class Netease extends MediaParsing
{
    // TODO 把axios全换成fetch
    /**
     * 处理网易云的媒体
     * @param originUrl 原始url
     * @returns mediaData
     */
    public async handleNeteaseMedia(originUrl: string)
    {
        let type: 'music' | 'video';
        let name: string;
        let signer: string;
        let cover: string;
        let url: string;
        let duration: number;
        let bitRate: number;
        const neteaseApi = new NeteaseApi();
        try
        {
            let id: number | null;
            if (originUrl.includes('http') && originUrl.includes('song'))
            {
                const match1 = originUrl.match(/id=(\d+)/);
                const match2 = originUrl.match(/\/song\/(\d+)/);

                id = match1 ? parseInt(match1[1]) : (match2 ? parseInt(match2[1]) : null);
                if (id === null)
                {
                    const mediaData = this.returnErrorMediaData(['暂不支持']);
                    return mediaData;
                }
            }
            else
            {
                const mediaData = this.returnErrorMediaData(['暂不支持']);
                return mediaData;
            }
            const songData = await neteaseApi.getNeteaseMusicDetail(id);

            if (!songData)
            {
                const mediaData = this.returnErrorMediaData(['没有找到歌曲']);
                return mediaData;
            }
            const songResource = await neteaseApi.getSongResource(id);
            url = await this.getRedirectUrl(songResource[0].url);
            type = 'music';
            name = songData.songs[0].name;
            cover = songResource[0].pic;

            bitRate = songData.songs[0].hMusic ? (songData.songs[0].hMusic.bitrate / 1000) : 128; // 如果 songData.hMusic 存在则使用其比特率，否则使用默认值 128
            signer = songData.songs[0].artists[0].name;
            duration = songData.songs[0].duration / 1000;
            const mediaData = this.returnCompleteMediaData([type], [name], [signer], [cover], [url], [duration], [bitRate]);
            return mediaData;
        } catch (error)
        {
            const mediaData = this.returnErrorMediaData([(error as Error).message]);
            return mediaData;
        }

    }

    public async handleNeteaseAlbum(originUrl: string, session: Session, color: string, queueRequest: boolean, options:Options)
    {
        async function delay(ms: number)
        {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
        const processSong = async (index: number) =>
        {
            const songResource = await neteaseApi.getSongResource(songId[index]);
            url.push(await this.getRedirectUrl(songResource[0].url));
            cover.push(songResource[0].pic);
        };
        const type: ('music' | 'video')[] = [];
        const songName: string[] = [];
        const signer: string[] = [];
        const cover: string[] = [];
        const url: string[] = [];
        const duration: number[] = [];
        const bitRate: number[] = [];
        const songId: number[] = [];

        let id: number | null;

        const musicDetail: MusicDetail[] = [];

        if (originUrl.includes('http') && originUrl.includes('album'))
        {
            const match1 = originUrl.match(/id=(\d+)/);
            const match2 = originUrl.match(/\/album\/(\d+)/);

            id = match1 ? parseInt(match1[1], 10) : (match2 ? parseInt(match2[1], 10) : null);
            if (id === null)
            {
                const mediaData = this.returnErrorMediaData(['暂不支持']);
                return mediaData;
            }
        } else
        {
            const mediaData = this.returnErrorMediaData(['暂不支持']);
            return mediaData;
        }

        const neteaseApi = new NeteaseApi();
        const album = await neteaseApi.getAlbumSimpleDetail(id);

        const songList = album.data.songRepVos;
        songList.forEach(song =>
        {
            songId.push(song.songId);
            songName.push(song.songName);
            signer.push(song.artistRepVos[0].artistName);
        });
        for (const song of songList)
        {
            const songId = song.songId;

            // 使用 songId 调用 neteaseApi.getNeteaseMusicDetail()
            const MusicDetail = await neteaseApi.getNeteaseMusicDetail(songId);

            // 处理返回的音乐详情
            if (MusicDetail)
            {
                musicDetail.push(MusicDetail);
            }
        }

        musicDetail.forEach(musicDetail =>
        {
            const song = musicDetail.songs[0]; // 假设你想获取第一首歌的信息

            // 获取时长并将其添加到 duration 数组中
            const songDuration = song.duration / 1000;
            duration.push(songDuration);

            // 获取比特率并将其添加到 bitRate 数组中
            const songBitRate = song.hMusic ? song.hMusic.bitrate / 1000 : 128;
            bitRate.push(songBitRate);

            type.push('music');
        });
        for (let i = 0; i < songId.length; i++)
        {
            if (queueRequest && !options['link'] && !options['data'] && !options['param'])
            {
                if (i > 0)
                {
                    await delay((duration[i - 1] * 1000) - 4000);
                }
                await processSong(i);
                session.send(`<audio name="${songName[i]}" url="${url[i]}" author="${signer[i]}" cover="${cover[i]}" duration="${duration[i]}" bitRate="${bitRate[i]}" color="${color || 'FFFFFF'}"/>`);
            } else if (!options['link'] && !options['data'] && !options['param']){
                await processSong(i);
                session.send(`<audio name="${songName[i]}" url="${url[i]}" author="${signer[i]}" cover="${cover[i]}" duration="${duration[i]}" bitRate="${bitRate[i]}" color="${color || 'FFFFFF'}"/>`);
            }
        }

        const mediaData = this.returnCompleteMediaData(type, songName, signer, cover, url, duration, bitRate);
        return mediaData;

    }


    public async handleNeteaseSongList(originUrl: string, session: Session, color: string, queueRequest: boolean, options:Options)
    {
        async function delay(ms: number)
        {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
        const processSong = async (index: number) =>
        {
            const songResource = await neteaseApi.getSongResource(songId[index]);
            url.push(await this.getRedirectUrl(songResource[0].url));
            cover.push(songResource[0].pic);
        };
        const type: ('music' | 'video')[] = [];
        const songName: string[] = [];
        const signer: string[] = [];
        const cover: string[] = [];
        const url: string[] = [];
        const duration: number[] = [];
        const bitRate: number[] = [];
        const songId: number[] = [];

        let id: number | null;

        const musicDetail: MusicDetail[] = [];

        if (originUrl.includes('http') && originUrl.includes('playlist'))
        {
            const match1 = originUrl.match(/id=(\d+)/);
            const match2 = originUrl.match(/\/playlist\/(\d+)/);

            id = match1 ? parseInt(match1[1]) : (match2 ? parseInt(match2[1]) : null);
            if (id === null)
            {
                const mediaData = this.returnErrorMediaData(['暂不支持']);
                return mediaData;
            }
        } else
        {
            const mediaData = this.returnErrorMediaData(['暂不支持']);
            return mediaData;
        }

        const neteaseApi = new NeteaseApi();
        const playList = await neteaseApi.getSonglistDetail(id);

        const songList = playList.playlist.tracks
        playList.playlist.tracks.forEach(song =>
        {
            songId.push(song.id);
            songName.push(song.name);
            signer.push(song.ar[0].name);
        });
        for (const song of songList)
        {
            const songId = song.id;

            // 使用 songId 调用 neteaseApi.getNeteaseMusicDetail()
            const MusicDetail = await neteaseApi.getNeteaseMusicDetail(songId);

            // 处理返回的音乐详情
            if (MusicDetail)
            {
                musicDetail.push(MusicDetail);
            }
        }

        musicDetail.forEach(musicDetail =>
        {
            const song = musicDetail.songs[0]; // 假设你想获取第一首歌的信息

            // 获取时长并将其添加到 duration 数组中
            const songDuration = song.duration / 1000;
            duration.push(songDuration);

            // 获取比特率并将其添加到 bitRate 数组中
            const songBitRate = song.hMusic ? song.hMusic.bitrate / 1000 : 128;
            bitRate.push(songBitRate);

            type.push('music');
        });

        for (let i = 0; i < songId.length; i++)
        {
            if (queueRequest && !options['link'] && !options['data'] && !options['param'])
            {
                if (i > 0)
                {
                    await delay((duration[i - 1] * 1000) - 4000);
                }
                await processSong(i);
                session.send(`<audio name="${songName[i]}" url="${url[i]}" author="${signer[i]}" cover="${cover[i]}" duration="${duration[i]}" bitRate="${bitRate[i]}" color="${color || 'FFFFFF'}"/>`);
            } else if (!options['link'] && !options['data'] && !options['param']){
                await processSong(i);
                session.send(`<audio name="${songName[i]}" url="${url[i]}" author="${signer[i]}" cover="${cover[i]}" duration="${duration[i]}" bitRate="${bitRate[i]}" color="${color || 'FFFFFF'}"/>`);
            }
        }

        const mediaData = this.returnCompleteMediaData(type, songName, signer, cover, url, duration, bitRate);
        return mediaData;

    }

}