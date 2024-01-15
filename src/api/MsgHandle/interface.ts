interface msgInfo
{
    hasRespond: boolean;
    messageContent: string | null;
    mediaData: MediaData | null;
}
type Options = {
    [key: string]: boolean | undefined;  // This is the index signature
}