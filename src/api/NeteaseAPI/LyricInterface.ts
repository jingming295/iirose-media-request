export interface Lyric{
    sgc: boolean;
    sfy: boolean;
    qfy: boolean;
    transUser:transUser;
    lyricUser:transUser;
    lrc: lrc;// 原版歌词
    klyric: lrc; // 未知
    tlyric: lrc;// 中文翻译歌词
    romalrc: lrc;// 罗马音歌词
    code: number;
}

interface transUser{

    id: number;
    status: number;
    demand: number;
    userid: number;
    nickname: string;
    uptime: number;
}

interface lrc{
    version: number;
    lyric: string;
}