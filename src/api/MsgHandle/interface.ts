interface msgInfo
{
    hasRespond: boolean;
    messageContent: string | null;
    mediaData: MediaData | null;
}
interface Config
{
    timeOut: number;
    waitTime: number;
    SESSDATA: string;
    qn: number;
    platform: string;
    mediaCardColor: string;
    noHentai: boolean;
    trackUser: boolean;
    detectUpdate: boolean;
}