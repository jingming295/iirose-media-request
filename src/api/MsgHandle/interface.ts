import { MediaData } from "../MediaParsing/interface";

export interface msgInfo
{
    hasRespond: boolean;
    messageContent: string | null;
    mediaData: MediaData | null;
}
export type Options = {
    [key: string]: boolean | undefined;  // This is the index signature
}