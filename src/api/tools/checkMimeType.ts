export class CheckMimeType {
    isVideo(mimeType:string){
        if(mimeType === 'video/mp4' || mimeType === 'video/webm' || mimeType === 'video/x-matroska' || mimeType === 'video/quicktime' 
        || mimeType === 'application/vnd.apple.mpegURL' || mimeType === 'application/vnd.apple.mpegurl') return true
        return false
    }

    isMusic(mimeType:string){
        if(mimeType === 'audio/mpeg' || mimeType === 'audio/wav' || mimeType === 'audio/x-ms-wma' || mimeType === 'audio/aac' 
        || mimeType === 'audio/ogg' || mimeType === 'audio/flac') return true
        return false
    }
}