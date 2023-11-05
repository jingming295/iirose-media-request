import { MediaParsing } from ".";
import { NeteaseApi } from '../NeteaseAPI';
import { Logger, Session } from "koishi";

/**
 * 主要处理网易云的网站
 */
export class Netease extends MediaParsing
{
    private neteaseApi: NeteaseApi;
    logger:Logger
    constructor()
    {
        super();
        this.neteaseApi = new NeteaseApi();
        const logger = new Logger('iirose-media-request');
        this.logger = logger
    }

    /**
     * 处理专辑和歌单
     * @param originUrl 
     * @param session 
     * @param color 
     * @param queueRequest 
     * @param options 
     * @returns 
     */
    public async handleNeteaseAlbumAndSongList(originUrl: string, session: Session, color: string, queueRequest: boolean, options: Options)
    {
        const id = await this.getIdFromOriginUrl(originUrl);
        const { songName, signer, cover, url, duration, bitRate, songId, musicDetail } = this.initializeArrays();
        if (!id) return this.handleNullId();

        if (!this.isValidOriginUrl(originUrl)) return this.handleNullId();

        if (originUrl.includes('album')) await this.processAlbumDetails(id, songId, songName, signer, musicDetail);

        else if (originUrl.includes('playlist')) await this.processPlaylistDetails(id, songId, songName, signer, musicDetail);


        musicDetail.forEach(musicDetail =>
        {
            this.processMusicDetail(musicDetail, duration, bitRate, ["music"]);
        });
        for (let i = 0; i < songId.length; i++)
        {
            if (queueRequest && !options['link'] && !options['data'] && !options['param'])
            {
                if (i > 0)
                {
                    await this.delay((duration[i - 1] * 1000) - 4000);
                }
                const processSong = await this.processSong(songId[i], url, cover);
                if (processSong) this.sendMessage(session, songName[i], url[i], signer[i], cover[i], duration[i], bitRate[i], color || 'FFFFFF');
                else duration[i] = 0
            } else if (!options['link'] && !options['data'] && !options['param'])
            {
                const processSong = await this.processSong(songId[i], url, cover);
                if (processSong) this.sendMessage(session, songName[i], url[i], signer[i], cover[i], duration[i], bitRate[i], color || 'FFFFFF');
            }
        }

        const completeMediaData = this.returnCompleteMediaData(["music"], songName, signer, cover, url, duration, bitRate);
        return completeMediaData;
    }

    private async sendMessage(session: Session, songName: string, url: string, signer: string, cover: string, duration: number, bitRate: number, color: string = 'FFFFFF')
    {
        session.send(`<audio name="${songName}" url="${url}" author="${signer}" cover="${cover}" duration="${duration}" bitRate="${bitRate}" color="${color}"/>`);
    }


    private isValidOriginUrl(originUrl: string): boolean
    {
        return originUrl.includes('http') && (originUrl.includes('album') || originUrl.includes('playlist'));
    }

    private handleNullId(): MediaData[]
    {
        return this.returnErrorMediaData(['暂不支持']);
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
        if(!playList){
            return null
        }
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

    private initializeArrays()
    {
        const songName: string[] = [];
        const signer: string[] = [];
        const cover: string[] = [];
        const url: string[] = [];
        const duration: number[] = [];
        const bitRate: number[] = [];
        const songId: number[] = [];
        const musicDetail: MusicDetail[] = [];

        return { songName, signer, cover, url, duration, bitRate, songId, musicDetail };
    }

    private async getIdFromOriginUrl(originUrl: string)
    {
        const match1 = originUrl.match(/id=(\d+)/);
        const match2 = originUrl.match(/\/(album|playlist)\/(\d+)/);
        return match1 ? parseInt(match1[1], 10) : (match2 ? parseInt(match2[2], 10) : null);
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
    async processSong(songId: number, url: string[], cover: string[])
    {
        try {
            const songResource = await this.neteaseApi.getSongResource(songId);
            if(!songResource){
                return
            }
            url.push(await this.getRedirectUrl(songResource[0].url));
            cover.push(songResource[0].pic);
            return true;
        } catch (error) {
            this.logger.warn(`歌曲${songId}: ${(error as Error).message}`)
        }

    }
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
            if(!songResource){
                const mediaData = this.returnErrorMediaData([`无法获取歌曲${id}`]);
                return mediaData;
            }
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

