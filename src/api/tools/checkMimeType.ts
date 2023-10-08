/**
 * @description 检查Mime type是否为视频或音频格式
 */
export class CheckMimeType
{
    /**
     * @description 检查是否为视频格式
     * @param mimeType - Mime类型
     * @returns boolean
     */
    isVideo(mimeType: string)
    {
        if (mimeType === 'video/mp4' || mimeType === 'video/webm' || mimeType === 'video/x-matroska' || mimeType === 'video/quicktime'
            || mimeType === 'application/vnd.apple.mpegURL' || mimeType === 'application/vnd.apple.mpegurl') return true;
        return false;
    }

    /**
     * @description 检查是否为音乐格式
     * @param mimeType - Mime类型
     * @returns boolean
     */
    isMusic(mimeType: string)
    {
        if (mimeType === 'audio/mpeg' || mimeType === 'audio/wav' || mimeType === 'audio/x-ms-wma' || mimeType === 'audio/aac'
            || mimeType === 'audio/ogg' || mimeType === 'audio/flac') return true;
        return false;
    }
}
