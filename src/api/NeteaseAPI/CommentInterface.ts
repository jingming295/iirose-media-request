export interface NeteaseComment{
    cnum: number;
    code: number;
    commentBanner: null; // 未知
    comments:comments[]
    hotComments:comments[]

    isMusician: boolean; // 是否是音乐人?
    more: boolean; // 是否有更多评论?
    moreHot: boolean; // 是否有更多热门评论?
    topComments:{}[]
    total: number; // 总评论数
    userId: number; // 用户id
}

interface comments{
    beReplied:[]
    commentId: number;
    commentLocationType: number;
    content: string; // 评论
    contentResource:null // 未知
    decoration:{} // 未知
    expressionUrl:null // 未知
    grade: null // 未知
    ipLocation:{
        ip:null // ip
        location:string // 位置
        userId:number // 用户id
    }
    liked: boolean; // 未知
    likedCount: number; // 未知
    needDisplayTime:boolean; // 未知
    owner: boolean; // 未知
    parentCommentId: number; // 未知
    pendantData:null // 未知
    repliedMark:null // 未知
    richContent:string // 评论
    showFloorComment: null // 未知
    status: number; // 未知
    time: number; // 时间戳
    timeStr: string; // 时间 xx分钟前之类的
    userBizLevels:null // 未知
    user:{
        anonym: number; // 未知
        authStatus: number; // 未知
        avatarDetail:null // 未知
        avatarUrl: string; // 头像Url
        commonIdentity:null // 未知
        expertTags:null // 未知
        experts: null // 未知
        followed: boolean; // 是否关注
        liveInfo:null // 未知
        locationInfo:null // 未知
        mutual:boolean; // 未知
        nickname: string; // 昵称
        remarkName: null
        socialUserId: null
        target: null
        userId: number; // 用户id
        userType: number; // 未知
        vipType: number; // 未知
        vipRights:{
            associator:{
                iconUrl: string; // vip图标
                rights: boolean; // 未知
                vipCode: number; // 未知
            }
            musicPackage:{
                iconUrl: string; // vip图标
                rights: boolean; // 未知
                vipCode: number; // 未知
            }
            redVipAnnualCount: number; // 未知
            redVipLevel: number; // 未知
            relationType: number; // 未知
            redplus:null // 未知
        }
    }
    
}