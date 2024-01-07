
interface MediaData
{
    type: 'music' | 'video';
    name: string;
    signer: string;
    cover: string;
    link: string;
    url: string;
    duration: number;
    bitRate: number;
    error: string | null;
}
interface Attribute
{
    name: string;
    value: string;
}

interface ElementAttributes
{
    tagName: string;
    attrs: Attribute[];
    classList: string[];
}

interface ResourceUrls
{
    url: string | null,
    mimetype: string | null;

}

type CombinedQualityInfo = [string, number];