export interface Lyric{
    sgc: boolean;
    sfy: boolean;
    qfy: boolean;
    transUser:transUser;
    lyricUser:transUser;
    lrc: lrc | null;// 原版歌词
    klyric: lrc | null; // 未知
    tlyric: lrc | null;// 中文翻译歌词
    romalrc: lrc | null;// 罗马音歌词
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