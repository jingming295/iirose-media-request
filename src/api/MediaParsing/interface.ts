
interface MediaData {
    type: 'music' | 'video'
    name: string
    signer: string
    cover: string
    link: string
    url: string
    duration: number
    bitRate: number
    color: string
    error: string
}

interface mediaData {
    type: string
    name: string;
    resourceUrls: string[];
    error:string
  }