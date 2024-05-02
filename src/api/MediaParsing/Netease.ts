import { MediaParsing } from ".";
import { NeteaseApi } from '../NeteaseAPI';
import { Logger, Session } from "koishi";
import { MusicDetail } from "../NeteaseAPI/interface";
import { LyricLine, MediaData } from "./interface";
import { Options } from "../MsgHandle/interface";

/**
 * 主要处理网易云的网站
 */
export class Netease extends MediaParsing
{
    private neteaseApi: NeteaseApi;
    logger: Logger;
    constructor()
    {
        super();
        this.neteaseApi = new NeteaseApi();
        const logger = new Logger('iirose-media-request');
        this.logger = logger;
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
            this.processMusicDetail(musicDetail, cover, duration, bitRate, ["music"]);
        });
        for (let i = 0; i < songId.length; i++)
        {
            let lyric: string | null = null;
            const link = `https://music.163.com/#/song?id=${songId[i]}`;
            const lyricData = await this.neteaseApi.getLyric(songId[i]);
            if (lyricData.lrc && lyricData.tlyric){
                lyric = this.mergeLyrics(lyricData.lrc.lyric, lyricData.tlyric.lyric);
            } else if (lyricData.lrc){
                lyric = lyricData.lrc.lyric;
            }
            
            if (queueRequest && !options['link'] && !options['data'] && !options['param'])
            {
                if (i > 0)
                {
                    await this.delay((duration[i - 1] * 1000) - 4000);
                }
                const processSong = await this.processSong(songId[i], url);

                if (processSong) this.sendMessage(session, songName[i], url[i], signer[i], cover[i], duration[i], bitRate[i], color || 'FFFFFF', lyric, link);
                else duration[i] = 0;
            } else if (!options['link'] && !options['data'] && !options['param'])
            {
                const processSong = await this.processSong(songId[i], url);
                
                if (processSong) this.sendMessage(session, songName[i], url[i], signer[i], cover[i], duration[i], bitRate[i], color || 'FFFFFF', lyric, link);
            }
        }

        const completeMediaData = this.returnCompleteMediaData(["music"], [], [], [], [], [], []);
        return completeMediaData;
    }

    private async sendMessage(session: Session, songName: string, url: string, signer: string, cover: string, duration: number, bitRate: number, color: string = 'FFFFFF', lyric: string|null, link: string)
    {
        session.send(`<audio name="${songName}" url="${url}" link="${link}" author="${signer}" cover="${cover}" duration="${duration}" bitRate="${bitRate}" color="${color}" lyrics="${lyric}" origin="netease"/>`);
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
        const album = await this.neteaseApi.getAlbumData(id);
        const songList = album.songs;

        for (const song of songList)
        {
            songId.push(song.id);
            songName.push(`${song.name}`);
            signer.push(album.album.artist.name);

            const MusicDetail = await this.neteaseApi.getNeteaseMusicDetail(song.id);

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
        if (!playList)
        {
            return null;
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
    private processMusicDetail(musicDetail: MusicDetail, cover: string[], duration: number[], bitRate: number[], type: string[])
    {
        const song = musicDetail.songs[0];

        const songDuration = song.duration / 1000;
        duration.push(songDuration);

        const songBitRate = song.hMusic ? song.hMusic.bitrate / 1000 : 128;
        bitRate.push(songBitRate);

        const songCover = song.album.picUrl;
        cover.push(songCover);

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
    async processSong(songId: number, url: string[])
    {
        const songResource = await this.neteaseApi.getSongResource(songId);
        if (!songResource)
        {
            return;
        }
        url.push(songResource.url);
        return true;
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
        let link: string;
        let lyric: string | null = null;

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
        if (!songResource)
        {
            const mediaData = this.returnErrorMediaData([`无法获取歌曲${id}`]);
            return mediaData;
        }
        const lyricData = await this.neteaseApi.getLyric(id);
        const commentData = await this.neteaseApi.getComment(id);
        const hotComments = commentData?.hotComments;
        let comment: string | undefined;
        if (hotComments && hotComments.length > 0) {
            // 生成一个 0 到 hotComments.length - 1 之间的随机整数
            const randomIndex = Math.floor(Math.random() * hotComments.length);
            const selectedComment = hotComments[randomIndex].content;
            
            // 现在你可以使用selectedComment做你想要的事情
            comment = selectedComment;
          } else {
            comment = undefined
          }
          


        url = songResource.url;
        type = 'music';
        name = songData.songs[0].name;
        cover = songData.songs[0].album.picUrl;
        bitRate = songResource.br/1000; // 如果 songData.hMusic 存在则使用其比特率，否则使用默认值 128
        signer = songData.songs[0].artists[0].name;
        link = `https://music.163.com/#/song?id=${id}`
        duration = songData.songs[0].duration / 1000;
        if(lyricData.lrc && lyricData.tlyric){
            lyric = this.mergeLyrics(lyricData.lrc.lyric, lyricData.tlyric.lyric);
        } else if (lyricData.lrc){
            lyric = lyricData.lrc.lyric;
        }
        
        const mediaData = this.returnCompleteMediaData([type], [name], [signer], [cover], [url], [duration], [bitRate], [lyric], ['netease'], [link], [comment]);
        return mediaData;
    }

    private mergeLyrics(jpLyrics: string, cnLyrics: string): string {
        const jpLines = jpLyrics.split('\n');
        const cnLines = cnLyrics.split('\n');
    
        const jpEntries: { [key: string]: string } = {};
        const cnEntries: { [key: string]: string } = {};
    
        // Parse Japanese lyrics
        for (const line of jpLines) {
            const timeRegex = /\[(\d+:\d+\.\d+)\]/;
            const timeMatch = line.match(timeRegex);
            if (timeMatch) {
                const time = timeMatch[1];
                const content = line.replace(timeRegex, '').trim();
                jpEntries[time] = content;
            }
        }
    
        // Parse Chinese lyrics
        for (const line of cnLines) {
            const timeRegex = /\[(\d+:\d+\.\d+)\]/;
            const timeMatch = line.match(timeRegex);
            if (timeMatch) {
                const time = timeMatch[1];
                const content = line.replace(timeRegex, '').trim();
                cnEntries[time] = content;
            }
        }
    
        // Merge and format
        const mergedLines: { time: string; content: string; translation: string }[] = [];
        for (const time in jpEntries) {
            const jpContent = jpEntries[time];
            const cnContent = cnEntries[time] || ''; // Use empty string if no translation
    
            mergedLines.push({ time, content: jpContent, translation: cnContent });
        }
    
        // Format the merged lines
        const mergedOutput = mergedLines.map(line => {
            const { time, content, translation } = line;
            let outputLine = `[${time}] ${content}`;
            if (translation) {
                outputLine += ` | ${translation}`;
            }
            return outputLine;
        }).join('\n');
    
        return mergedOutput;
    }

}

