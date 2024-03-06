
export interface MediaData
{
    type: 'music' | 'video';
    name: string;
    signer: string;
    cover: string;
    link: string;
    url: string;
    duration: number;
    bitRate: number;
    lyrics: string | null;
    origin: string | null;
    error: string | null;
}
interface Attribute
{
    name: string;
    value: string;
}

export interface ElementAttributes
{
    tagName: string;
    attrs: Attribute[];
    classList: string[];
}

export interface ResourceUrls
{
    url: string | null,
    mimetype: string | null;

}

export type CombinedQualityInfo = ['html5'|'pc', number];

export interface LyricLine {
    time: string;
    content: string;
    translation: string;
}