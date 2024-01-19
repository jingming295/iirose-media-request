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
        video_info:{
            durl:durl[];
        }
    };
}

interface durl {
    size: number;
    ahead: string;
    length: number;
    vhead: string;
    backup_url: string[];
    url: string;
    order: number;
    md5: string;
  }

  interface SupportFormat {
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
        from: string;
        result: string;
        message: string;
        quality: number;
        format: string;
        timelength: number;
        accept_format: string;
        accept_description: string[];
        accept_quality: number[];
        video_codecid: number;
        seek_param: string;
        seek_type: string;
        durl: durl[];
        support_formats: SupportFormat[];
        high_format: string; // Define the structure if needed
        last_play_time: number;
        last_play_cid: number;
    };
}
