export class ParseMediaMetaData
{
    /**
     * 解析m3u8
     * @param data 
     * @param url m3u8第一个链接
     * @returns 
     */
    public async parseM3U8(data: Uint8Array, url: string)
    {
        const text = new TextDecoder().decode(data);
        const m3u8Url = this.parseM3U8File(text);
        if (m3u8Url)
        {
            const baseUrl = url.substring(0, url.lastIndexOf('/') + 1);
            const fullM3U8Url = new URL(m3u8Url, baseUrl).toString();

            const m3u8Data = await this.getM3U8NextFile(fullM3U8Url);
            const m3u8Text = new TextDecoder().decode(m3u8Data);

            return this.processM3U8Text(m3u8Text);
        }

        return this.processM3U8Text(text);
    }

    private parseM3U8File(text: string): string | null
    {
        for (const line of text.split('\n'))
        {
            if (line.includes('.m3u8'))
            {
                return line.trim();
            }
        }
        return null;
    }

    private processM3U8Text(text: string): number
    {
        let duration = 0;
        for (const line of text.split('\n'))
        {
            if (line.startsWith('#EXTINF:'))
            {
                const parts = line.split(':');
                if (parts.length > 1)
                {
                    const EXTINFDuration = parseFloat(parts[1]);
                    if (!isNaN(EXTINFDuration))
                    {
                        duration += EXTINFDuration;
                    }
                }
            }
        }
        return duration;
    }

    private async getM3U8NextFile(url: string)
    {
        try
        {
            const response = await fetch(url, {
                headers: {
                    'Range': 'bytes=0-100000'
                }
            });
            if (!response.ok)
            {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.arrayBuffer();
            const uint8Array = new Uint8Array(data);
            return uint8Array;
        } catch (error)
        {
            throw error; // 如果没有 response 对象，将错误重新抛出
        }
    }
    

    /**
     * 解析mp4找到moovbox, 这个方法套用在m4a上居然也行
     * @param data 
     */
    public parseMP4Duration(data: Uint8Array)
    {
        let position = 0;
        while (position < data.length)
        {
            const size = data[position] << 24 | data[position + 1] << 16 | data[position + 2] << 8 | data[position + 3];
            const type = String.fromCharCode(data[position + 4], data[position + 5], data[position + 6], data[position + 7]);
            if (type === 'moov')
            {
                return this.parseMoov(data.subarray(position + 8), size - 8);
            }
            position += size;
        }
        throw new Error(`parseMoov: 没找到mp4的时长`);
    }

    /**
     * 解析Moov box
     * @param data 
     * @param size 
     */
    private parseMoov(data: Uint8Array, size: number)
    {
        let position = 0;
        while (position < size)
        {
            const boxSize = data[position] << 24 | data[position + 1] << 16 | data[position + 2] << 8 | data[position + 3];
            const type = String.fromCharCode(data[position + 4], data[position + 5], data[position + 6], data[position + 7]);

            if (type === 'mvhd') return this.parseMvhd(data.subarray(position + 8, position + boxSize));

            position += boxSize;
        }
        throw new Error(`parseMoov: 没找到mp4的时长`);
    }

    /**
     * 解析Mvhd box
     * @param data 
     */
    private parseMvhd(data: Uint8Array)
    {
        const version = data[0];
        const creationTime = data[4] << 24 | data[5] << 16 | data[6] << 8 | data[7];
        const modificationTime = data[8] << 24 | data[9] << 16 | data[10] << 8 | data[11];
        const timescale = data[12] << 24 | data[13] << 16 | data[14] << 8 | data[15];
        const duration = data[16] << 24 | data[17] << 16 | data[18] << 8 | data[19];
        const rate = data[24] << 8 | data[25];
        const volume = data[26] << 8 | data[27];
        // console.log(`creationTime: ${creationTime}`)
        // console.log(`modificationTime: ${modificationTime}`)
        // console.log(`timescale: ${timescale}`)
        // console.log(`duration: ${duration}`);
        // console.log(`rate: ${rate}`);
        // console.log(`volume: ${volume}`);
        return duration;
    }

    
}