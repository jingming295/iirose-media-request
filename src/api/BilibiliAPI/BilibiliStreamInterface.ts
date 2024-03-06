export interface bangumiStream
{
    code: number;
    message: string;
    result: {
        accept_format: string;
        code: number;
        seek_param: string;
        is_preview: number;
        fnval: number;
        video_project: boolean;
        fnver: number;
        type: string;
        bp: number;
        result: string;
        seek_type: string;
        vip_type: number;
        from: string;
        video_codecid: number;
        record_info: {
            record_icon: string;
            record: string;
        };
        durl: durl[];
        is_drm: boolean;
        no_rexcode: number;
        format: string;
        support_formats: SupportFormat[];
        accept_quality: number[];
        quality: number;
        timelength: number;
        has_paid: boolean;
        vip_status: number;
        clip_info_list: string[]; // 根据实际情况填写具体的类型
        accept_description: string[];
        status: number;
        video_info: {
            durl: durl[];
        };
    };
}

interface durl
{
    size: number;
    ahead: string;
    length: number;
    vhead: string;
    backup_url: string[];
    url: string;
    order: number;
    md5: string;
}

interface SupportFormat
{
    display_desc: string;
    superscript: string;
    need_login: boolean;
    codecs: string[]; // 请根据实际情况填写具体的类型
    format: string;
    description: string;
    quality: number;
    new_description: string;
}



export interface BVideoStream
{
    code: number;
    message: string;
    ttl: number;
    data: {
        from: string | null;
        result: string | null;
        message: string | null;
        quality: number | null;
        format: string | null;
        timelength: number | null;
        accept_format: string | null;
        accept_description: string[] | null;
        accept_quality: number[] | null;
        video_codecid: number | null;
        seek_param: string | null;
        seek_type: string | null;
        durl: durl[] | null | null;
        support_formats: SupportFormat[] | null;
        high_format: string | null; // Define the structure if needed
        last_play_time: number | null;
        last_play_cid: number | null;
        v_voucher: string | null | undefined;
    } | null;
}
