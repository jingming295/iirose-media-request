import { MediaParsing } from ".";
import { NeteaseApi } from '../NeteaseAPI';
import { Session } from "koishi";

/**
 * 主要处理网易云的网站
 */
export class Netease extends MediaParsing
{
    private neteaseApi: NeteaseApi;
    constructor()
    {
        super();
        this.neteaseApi = new NeteaseApi();
    }


    public async handleNeteaseAlbumAndSongList(originUrl: string, session: Session, color: string, queueRequest: boolean, options: Options)
    {
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

            if (!id)
            {
                const mediaData = this.returnErrorMediaData(['暂不支持']);
                return mediaData;
            }
            await this.processAlbumDetails(id, songId, songName, signer, musicDetail);
        } else if (originUrl.includes('http') && originUrl.includes('playlist'))
        {
            const match1 = originUrl.match(/id=(\d+)/);
            const match2 = originUrl.match(/\/playlist\/(\d+)/);

            id = match1 ? parseInt(match1[1]) : (match2 ? parseInt(match2[1]) : null);
            if (id === null)
            {
                const mediaData = this.returnErrorMediaData(['暂不支持']);
                return mediaData;
            }
            await this.processPlaylistDetails(id, songId, songName, signer, musicDetail);
        } else
        {
            const mediaData = this.returnErrorMediaData(['暂不支持']);
            return mediaData;
        }
        // 在你的代码中调用它
        musicDetail.forEach(musicDetail =>
        {
            this.processMusicDetail(musicDetail, duration, bitRate, type);
        });
        for (let i = 0; i < songId.length; i++)
        {
            if (queueRequest && !options['link'] && !options['data'] && !options['param'])
            {
                if (i > 0)
                {
                    await this.delay((duration[i - 1] * 1000) - 4000);
                }
                await this.processSong(songId[i], url, cover, this.neteaseApi);
                session.send(`<audio name="${songName[i]}" url="${url[i]}" author="${signer[i]}" cover="${cover[i]}" duration="${duration[i]}" bitRate="${bitRate[i]}" color="${color || 'FFFFFF'}"/>`);
            } else if (!options['link'] && !options['data'] && !options['param'])
            {
                await this.processSong(songId[i], url, cover, this.neteaseApi);
                session.send(`<audio name="${songName[i]}" url="${url[i]}" author="${signer[i]}" cover="${cover[i]}" duration="${duration[i]}" bitRate="${bitRate[i]}" color="${color || 'FFFFFF'}"/>`);
            }
        }

        const mediaData = this.returnCompleteMediaData(type, songName, signer, cover, url, duration, bitRate);
        return mediaData;

    }

    /**
     * 处理AlbumDetails
     * @param id 
     * @param songId 
     * @param songName 
     * @param signer 
     * @param musicDetail 
     */
    private async processAlbumDetails(id: number, songId: number[], songName: string[], signer: string[], musicDetail: MusicDetail[])
    {
        const album = await this.neteaseApi.getAlbumSimpleDetail(id);
        const songList = album.data.songRepVos;

        for (const song of songList)
        {
            songId.push(song.songId);
            songName.push(song.songName);
            signer.push(song.artistRepVos[0].artistName);

            const MusicDetail = await this.neteaseApi.getNeteaseMusicDetail(song.songId);

            if (MusicDetail)
            {
                musicDetail.push(MusicDetail);
            }
        }
    }

    /**
     * 处理PlaylistDetails
     * @param id 
     * @param songId 
     * @param songName 
     * @param signer 
     * @param musicDetail 
     */
    private async processPlaylistDetails(id: number, songId: number[], songName: string[], signer: string[], musicDetail: MusicDetail[])
    {
        const playList = await this.neteaseApi.getSonglistDetail(id);
        const songList = playList.playlist.tracks;

        for (const song of songList)
        {
            songId.push(song.id);
            songName.push(song.name);
            signer.push(song.ar[0].name);

            const MusicDetail = await this.neteaseApi.getNeteaseMusicDetail(song.id);

            if (MusicDetail)
            {
                musicDetail.push(MusicDetail);
            }
        }
    }

    /**
     * 处理musicDetail
     * @param musicDetail 
     * @param duration 
     * @param bitRate 
     * @param type 
     */
    private processMusicDetail(musicDetail: MusicDetail, duration: number[], bitRate: number[], type: string[])
    {
        const song = musicDetail.songs[0];

        const songDuration = song.duration / 1000;
        duration.push(songDuration);

        const songBitRate = song.hMusic ? song.hMusic.bitrate / 1000 : 128;
        bitRate.push(songBitRate);

        type.push('music');
    }


    /**
     * 延迟
     * @param ms 
     * @returns 
     */
    async delay(ms: number)
    {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 处理歌曲url这些
     * @param songId 
     * @param url 
     * @param cover 
     * @param neteaseApi 
     */
    async processSong(songId: number, url: string[], cover: string[], neteaseApi: NeteaseApi)
    {
        const songResource = await neteaseApi.getSongResource(songId);
        url.push(await this.getRedirectUrl(songResource[0].url));
        cover.push(songResource[0].pic);
    }

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
            const songData = await this.neteaseApi.getNeteaseMusicDetail(id);

            if (!songData)
            {
                const mediaData = this.returnErrorMediaData(['没有找到歌曲']);
                return mediaData;
            }
            const songResource = await this.neteaseApi.getSongResource(id);
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
}

