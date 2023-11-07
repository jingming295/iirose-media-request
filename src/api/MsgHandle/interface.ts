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
    qn: number;
    platform: string;
    mediaCardColor: string;
    noHentai: boolean;
    trackUser: boolean;
    detectUpdate: boolean;
    maxCpuUsage: number;
    queueRequest: boolean;
}
type Options = {
    [key: string]: boolean | undefined;  // This is the index signature
}