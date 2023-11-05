/**
 * 使用 https://api.bilibili.com/x/web-interface/view 的时候返回的接口
 */
interface BVideoDetail
{
  code: number;
  message: string;
  ttl: number;
  data: VideoData;
}

/**
 * BVideoDetail下的data
 */
interface VideoData
{
  bvid: string;
  aid: number;
  videos: number;
  tid: number;
  tname: string;
  copyright: number;
  pic: string;
  title: string;
  pubdate: number;
  ctime: number;
  desc: string;
  desc_v2: {
    raw_text: string;
    type: number;
    biz_id: number;
  }[];
  state: number;
  duration: number;
  rights: {
    bp: number;
    elec: number;
    download: number;
    movie: number;
    pay: number;
    hd5: number;
    no_reprint: number;
    autoplay: number;
    ugc_pay: number;
    is_cooperation: number;
    ugc_pay_preview: number;
    no_background: number;
    clean_mode: number;
    is_stein_gate: number;
    is_360: number;
    no_share: number;
    arc_pay: number;
    free_watch: number;
  };
  owner: {
    mid: number;
    name: string;
    face: string;
  };
  stat: {
    aid: number;
    view: number;
    danmaku: number;
    reply: number;
    favorite: number;
    coin: number;
    share: number;
    now_rank: number;
    his_rank: number;
    like: number;
    dislike: number;
    evaluation: string;
    argue_msg: string;
    vt: number;
  };
  dynamic: string;
  cid: number;
  dimension: {
    width: number;
    height: number;
    rotate: number;
  };
  season_id: number;
  premiere: null;
  teenage_mode: number;
  is_chargeable_season: boolean;
  is_story: boolean;
  is_upower_exclusive: boolean;
  is_upower_play: boolean;
  enable_vt: number;
  vt_display: string;
  no_cache: boolean;
  pages: Page[];
  subtitle: {
    allow_submit: boolean;
    list: SubtitleList[];
  };
  ugc_season: {
    id: number;
    title: string;
    cover: string;
    mid: number;
    intro: string;
    sign_state: number;
    attribute: number;
    sections: ugc_season_Section[] | undefined;
    stat: {
      score: number;
      count: number;
      average: string;
    };
    ep_count: number;
    season_type: number;
    is_pay_season: boolean;
    enable_vt: number;
  };
  is_season_display: boolean;
  user_garb: {
    url_image_ani_cut: string;
  };
  honor_reply: HonorReply | Record<string, never>;
  like_icon: string;
  need_jump_bv: boolean;
  disable_show_up_info: boolean;
}

/**
 * BVideoDetail下的data的page
 * 如果视频有分页
 */
interface Page
{
  cid: number;
  page: number;
  from: string;
  part: string;
  duration: number;
  vid: string;
  weblink: string;
  dimension: {
    width: number;
    height: number;
    rotate: number;
  };
  first_frame: string;
}

/**
 * 视频获得的荣誉？
 */
interface HonorReply
{
  honor: {
    aid: number;
    type: number;
    desc: string;
    weekly_recommend_num: number;
  }[];
}
/**
 * 页面？
 */
interface page
{
  cid: number;
  page: number;
  from: string;
  part: string;
  duration: number;
  vid: string;
  weblink: string;
  dimension: {
    width: number;
    height: number;
  };
}
/**
 * 不知道有什么用
 */
interface Arc
{
  aid: number;
  videos: number;
  type_id: number;
  type_name: string;
  copyright: number;
  pic: string;
  title: string;
  pubdate: number;
  ctime: number;
  desc: string;
  state: number;
  duration: number;
  rights: {
    bp: number;
    elec: number;
    download: number;
    movie: number;
    pay: number;
    hd5: number;
    no_reprint: number;
    autoplay: number;
    ugc_pay: number;
    is_cooperation: number;
    ugc_pay_preview: number;
    arc_pay: number;
    free_watch: number;
  };
  author: {
    mid: number;
    name: string;
    face: string;
  };
  stat: {
    aid: number;
    view: number;
    danmaku: number;
    reply: number;
    fav: number;
    coin: number;
    share: number;
    now_rank: number;
    his_rank: number;
    like: number;
    dislike: number;
    evaluation: string;
    argue_msg: string;
    vt: number;
    vv: number;
  };
  dynamic: string;
  dimension: {
    width: number;
    height: number;
    rotate: number;
  };
  desc_v2: null; // 输出是null，不确定有没有其他输出
  is_chargeable_season: boolean;
  is_blooper: boolean;
  enable_vt: number;
  vt_display: string;
}
/**
 * 集？
 */
interface Episode
{
  season_id: number;
  section_id: number;
  id: number;
  aid: number;
  cid: number;
  title: string;
  attribute: number;
  arc: Arc;
  page: page;
  bvid: string;
}
/**
 * 还没研究是什么，暂时不知道
 */
interface ugc_season_Section
{
  season_id: number;
  id: number;
  title: string;
  type: number;
  episodes: Episode[];
}

/**
 * 字幕列表
 */
interface SubtitleList
{
  id: number;
  lan: string;
  lan_doc: string;
  is_lock: boolean;
  subtitle_url: string;
  type: number;
  id_str: string;
  ai_type: number;
  ai_status: number;
  author: {
    mid: number;
    name: string;
    sex: string;
    face: string;
    sign: string;
    rank: number;
    birthday: number;
    is_fake_account: number;
    is_deleted: number;
    in_reg_audit: number;
    is_senior_member: number;
  };
}




interface BangumiVideoDetail
{
  code: number;
  message: string;
  result: {
    activity: {
      head_bg_url: string;
      id: number;
      title: string;
    };
    actors: string;
    alias: string;
    areas: {
      id: number;
      name: string;
    }[];
    bkg_cover: string;
    cover: string;
    enable_vt: boolean;
    episodes: BangumiVideoDetail_Episodes[];
    evaluate: string;
    freya: {
      bubble_desc: string;
      bubble_show_cnt: number;
      icon_show: number;
    };
    hide_ep_vv_vt_dm: number;
    icon_font: {
      name: string;
      text: string;
    };
    jp_title: string;
    link: string;
    media_id: number;
    mode: number;
    new_ep: {
      desc: string;
      id: number;
      is_new: number;
      title: string;
    };
    payment: {
      discount: number;
      pay_type: {
        allow_discount: number;
        allow_pack: number;
        allow_ticket: number;
        allow_time_limit: number;
        allow_vip_discount: number;
        forbid_bb: number;
      }[];
      price: string;
      promotion: string;
      tip: string;
      view_start_time: number;
      vip_discount: number;
      vip_first_promotion: string;
      vip_price: string;
      vip_promotion: string;
    };
    play_strategy: {
      strategies: string[];
    };
    positive: {
      id: number;
      title: string;
    };
    publish: {
      is_finish: number;
      is_started: number;
      pub_time: string;
      pub_time_show: string;
      unknow_pub_date: number;
      weekday: number;
    };
    rating: {
      count: number;
      score: number;
    };
    record: string;
    rights: {
      allow_bp: number;
      allow_bp_rank: number;
      allow_download: number;
      allow_review: number;
      area_limit: number;
      ban_area_show: number;
      can_watch: number;
      copyright: string;
      forbid_pre: number;
      freya_white: number;
      is_cover_show: number;
      is_preview: number;
      only_vip_download: number;
      resource: string;
      watch_platform: number;
    };
    season_id: number;
    season_title: string;
    seasons: BangumiVideoDetail_Season[];
    section: BangumiVideoDetail_Section[];
    series: {
      display_type: number;
      series_id: number;
      series_title: string;
    };
    share_copy: string;
    share_sub_title: string;
    share_url: string;
    show: {
      wide_screen: number;
    };
    show_season_type: number;
    square_cover: string;
    staff: string;
    stat: {
      coins: number;
      danmakus: number;
      favorite: number;
      favorites: number;
      follow_text: string;
      likes: number;
      reply: number;
      share: number;
      views: number;
      vt: number;
    };
    status: number;
    styles: string[];
    subtitle: string;
    title: string;
    total: number;
    type: number;
    up_info: {
      avatar: string;
      avatar_subscript_url: string;
      follower: number;
      is_follow: number;
      mid: number;
      nickname_color: string;
      pendant: {
        image: string;
        name: string;
        pid: number;
      };
      theme_type: number;
      uname: string;
      verify_type: number;
      vip_label: {
        bg_color: string,
        bg_style: number,
        border_color: string,
        text: string,
        text_color: string;
      };
      vip_status: number;
      vip_type: number;
    };
    user_status: {
      area_limit: number;
      ban_area_show: number;
      follow: number;
      follow_status: number;
      login: number;
      pay: number;
      pay_pack_paid: number;
      progress: {
        last_ep_id: number;
        last_ep_index: string;
        last_time: number;
      };
      sponsor: number;
      vip_info: {
        due_date: number;
        status: number;
        type: number;
      };
    };
  };
}

interface BangumiVideoDetail_Episodes
{
  aid: number;
  badge: string;
  badge_info: {
    bg_color: string;
    bg_color_night: string;
    text: string;
  };
  badge_type: number;
  bvid: string;
  cid: number;
  cover: string;
  dimension: {
    height: number;
    rotate: number;
    width: number;
  };
  duration: number;
  enable_vt: boolean;
  ep_id: number;
  from: string;
  id: number;
  is_view_hide: boolean;
  link: string;
  long_title: string;
  pub_time: number;
  pv: number;
  release_date: string;
  rights: {
    allow_demand: number;
    allow_dm: number;
    allow_download: number;
    area_limit: number;
  };
  share_copy: string;
  share_url: string;
  short_link: string;
  showDrmLoginDialog: boolean;
  status: number;
  subtitle: string;
  title: string;
  vid: string;
}

interface BangumiVideoDetail_Season
{
  badge: string;
  badge_info: {
    bg_color: string;
    bg_color_night: string;
    text: string;
  };
  badge_type: number;
  cover: string;
  enable_vt: boolean;
  horizontal_cover_1610: string;
  horizontal_cover_169: string;
  icon_font: {
    name: string;
    text: string;
  };
  media_id: number;
  new_ep: {
    cover: string;
    id: number;
    index_show: string;
  };
  season_id: number;
  season_title: string;
  season_type: number;
  stat: {
    favorites: number;
    series_follow: number;
    views: number;
    vt: number;
  };
}

interface BangumiVideoDetail_Section
{
  attr: number;
  episode_id: number;
  episode_ids: number[];
  episodes: BangumiVideoDetail_Episodes[];
  id: number;
  title: string;
  type: number;
  type2: number;
  report?: {
    season_id: string;
    season_type: string;
    sec_title: string;
    section_id: string;
    section_type: string;
  };
}
