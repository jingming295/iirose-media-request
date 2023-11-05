interface ParamsObject
{
  s: string;
  type: number;
  limit: number;
  offset: number;
}

interface Header
{
  appver: string;
  versioncode: string;
  buildver: string;
  resolution: string;
  __csrf: string;
  os: string;
  requestId: string;
  MUSIC_A: string;
}

interface SearchSimpleAlbumParamsObject
{
  albumId: number;
  header: Header;
}
/**
 * 专辑
 */
interface Album
{
  message: string;
  data: {
    albumId: number;
    albumName: string;
    artistRepVos: Artist[];
    albumPicUrl: string;
    albumSubTitle: string;
    company: string;
    publishTime: number;
    songRepVos: Song[];
    production: string;
    language: string;
    type: string;
    transName: string | null;
  };
  code: number;
}

interface Artist
{
  artistId: number;
  artistName: string;
  alias: string | null;
  headPicUrl: string | null;
  area: string | null;
  type: string | null;
  desc: string | null;
  production: string | null;
  avatarPicUrl: string | null;
  transName: string | null;
}

interface Song
{
  songId: number;
  songName: string;
  artistRepVos: Artist[];
  songSubTitle: string;
  company: string | null;
  publishTime: number;
  language: string;
  no: number;
  disc: string;
  transName: string;
  mvIds: number[] | null;
  lyricContent: string | null;
  transLyricContent: string | null;
  playUrl: string | null;
  forTransLyric: string | null;
  noNeedLyric: boolean | null;
  lyricLock: boolean | null;
  transLyricLock: boolean | null;
  lyricIsEdited: boolean | null;
  duration: number | null;
}


/**
 * Music Detail
 */
interface MusicDetail
{
  songs: MusicDetailSong[];
  equalizers: string; // 这里是一个键值对，值的类型未知，可以根据需要修改
  code: number;
}

interface MusicDetailSong
{
  name: string;
  id: number;
  position: number;
  alias: string[];
  status: number;
  fee: number;
  copyrightId: number;
  disc: string;
  no: number;
  artists: MusicDetailArtists[];
  album: MusicDetailAlbum;
  starred: boolean;
  popularity: number;
  score: number;
  starredNum: number;
  duration: number;
  playedNum: number;
  dayPlays: number;
  hearTime: number;
  sqMusic: null; // 根据实际情况定义
  hrMusic: null; // 根据实际情况定义
  ringtone: string;
  crbt: null; // 根据实际情况定义
  audition: null; // 根据实际情况定义
  copyFrom: string;
  commentThreadId: string;
  rtUrl: null; // 根据实际情况定义
  ftype: number;
  rtUrls: null[]; // 根据实际情况定义
  copyright: number;
  transName: string;
  sign: null; // 根据实际情况定义
  mark: number;
  originCoverType: number;
  originSongSimpleData: null; // 根据实际情况定义
  single: number;
  noCopyrightRcmd: null; // 根据实际情况定义
  rtype: number;
  rurl: null; // 根据实际情况定义
  mvid: number;
  bMusic: MusicFormat;
  mp3Url: string; // 根据实际情况定义
  hMusic: MusicFormat;
  mMusic: MusicFormat;
  lMusic: MusicFormat;
  transNames: string[];
}

interface MusicDetailArtists
{
  name: string;
  id: number;
  picId: number;
  img1v1Id: number;
  briefDesc: string;
  picUrl: string;
  img1v1Url: string;
  albumSize: number;
  alias: null[];
  trans: string;
  musicSize: number;
  topicPerson: number;
}

interface MusicDetailAlbum
{
  name: string;
  id: number;
  type: string;
  size: number;
  picId: number;
  blurPicUrl: string;
  companyId: number;
  pic: number;
  picUrl: string;
  publishTime: number;
  description: string;
  tags: string;
  company: string;
  briefDesc: string;
  commentThreadId: string;
  artists: Artist[];
  subType: string;
  transName: null; // 根据实际情况定义
  onSale: boolean;
  mark: number;
  gapless: number;
  dolbyMark: number;
  picId_str: string;
}

interface MusicFormat
{
  name: string | null;
  id: number;
  size: number;
  extension: string;
  sr: number;
  dfsId: number;
  bitrate: number;
  playTime: number;
  volumeDelta: number;
}

/**
 * 歌单
 */
interface SongList
{
  code: number;
  relatedVideos: string;
  playlist: Playlist;
  urls: unknown[] | null;
  privileges: {
    id: number;
    fee: number;
    payed: number;
    realPayed: number;
    st: number;
    pl: number;
    dl: number;
    sp: number;
    cp: number;
    subp: number;
    cs: boolean;
    maxbr: number;
    fl: number;
    pc: unknown | null;
    toast: boolean;
    flag: number;
    paidBigBang: boolean;
    preSell: boolean;
    playMaxbr: number;
    downloadMaxbr: number;
    maxBrLevel: string;
    playMaxBrLevel: string;
    downloadMaxBrLevel: string;
    plLevel: string;
    dlLevel: string;
    flLevel: string;
    rscl: unknown | null;
    freeTrialPrivilege: {
      resConsumable: boolean;
      userConsumable: boolean;
      listenType: unknown | null;
      cannotListenReason: unknown | null;
    };
    rightSource: number;
    chargeInfoList: {
      rate: number;
      chargeUrl: unknown | null;
      chargeMessage: unknown | null;
      chargeType: number;
    }[];
  }[];
  sharedPrivilege: unknown | null;
  resEntrance: unknown | null;
  fromUsers: unknown[] | null;
  fromUserCount: number;
  songFromUsers: unknown[] | null;
}
interface Playlist
{
  id: number;
  name: string;
  coverImgId: number;
  coverImgUrl: string;
  coverImgId_str: string;
  adType: number;
  userId: number;
  createTime: number;
  status: number;
  opRecommend: boolean;
  highQuality: boolean;
  newImported: boolean;
  updateTime: number;
  trackCount: number;
  specialType: number;
  privacy: number;
  trackUpdateTime: number;
  commentThreadId: string;
  playCount: number;
  trackNumberUpdateTime: number;
  subscribedCount: number;
  cloudTrackCount: number;
  ordered: boolean;
  description: string | null;
  tags: string[];
  updateFrequency: string | null;
  backgroundCoverId: number;
  backgroundCoverUrl: string | null;
  titleImage: number;
  titleImageUrl: string | null;
  englishTitle: string | null;
  officialPlaylistType: string | null;
  copied: boolean;
  relateResType: string | null;
  subscribers: unknown[]; // 你可以根据实际数据结构填写更详细的类型
  subscribed: boolean;
  creator: PlaylistCreator;
  tracks: PlaylistTrack[];
  videoIds: unknown[] | null;
  videos: unknown[] | null;
  trackIds: PlaylistTrackId[];
  bannedTrackIds: unknown[] | null;
  mvResourceInfos: unknown[] | null;
  shareCount: number;
  commentCount: number;
  remixVideo: unknown | null;
  sharedUsers: unknown[] | null;
  historySharedUsers: unknown[] | null;
  gradeStatus: string;
  score: unknown | null;
  algTags: unknown | null;
  trialMode: number;
}
interface PlaylistTrack
{
  name: string;
  id: number;
  pst: number;
  t: number;
  ar: {
    id: number;
    name: string;
    tns: unknown[];
    alias: unknown[];
  }[];
  alia: string[];
  pop: number;
  st: number;
  rt: unknown | null;
  fee: number;
  v: number;
  crbt: unknown | null;
  cf: string;
  al: {
    id: number;
    name: string;
    picUrl: string;
    tns: unknown[];
    pic_str: string;
    pic: number;
  };
  dt: number;
  h: {
    br: number;
    fid: number;
    size: number;
    vd: number;
    sr: number;
  };
  m: {
    br: number;
    fid: number;
    size: number;
    vd: number;
    sr: number;
  };
  l: {
    br: number;
    fid: number;
    size: number;
    vd: number;
    sr: number;
  };
  sq: {
    br: number;
    fid: number;
    size: number;
    vd: number;
    sr: number;
  } | null;
  hr: unknown | null;
  a: unknown | null;
  cd: string;
  no: number;
  rtUrl: unknown | null;
  ftype: number;
  rtUrls: unknown[];
  djId: number;
  copyright: number;
  s_id: number;
  mark: number;
  originCoverType: number;
  originSongSimpleData: unknown | null;
  tagPicList: unknown | null;
  resourceState: boolean;
  version: number;
  songJumpInfo: unknown | null;
  entertainmentTags: unknown | null;
  awardTags: unknown | null;
  single: number;
  noCopyrightRcmd: unknown | null;
  mst: number;
  cp: number;
  mv: number;
  rtype: number;
  rurl: unknown | null;
  publishTime: number;
  videoInfo: {
    moreThanOne: boolean;
    video: unknown | null;
  };
  tns: string[];
}

interface PlaylistCreator
{
  defaultAvatar: boolean;
  province: number;
  authStatus: number;
  followed: boolean;
  avatarUrl: string;
  accountStatus: number;
  gender: number;
  city: number;
  birthday: number;
  userId: number;
  userType: number;
  nickname: string;
  signature: string;
  description: string;
  detailDescription: string;
  avatarImgId: number;
  backgroundImgId: number;
  backgroundUrl: string;
  authority: number;
  mutual: boolean;
  expertTags: unknown;
  experts: unknown;
  djStatus: number;
  vipType: number;
  remarkName: string | null;
  authenticationTypes: number;
  avatarDetail: unknown;
  avatarImgIdStr: string;
  backgroundImgIdStr: string;
  anchor: boolean;
  avatarImgId_str: string;
}
interface PlaylistTrackId
{
  id: number;
  v: number;
  t: number;
  at: number;
  alg: unknown | null;
  uid: number;
  rcmdReason: string;
  sc: unknown | null;
  f: unknown | null;
  sr: unknown | null;
}

interface songResource
{
  name: string,
  artist: string,
  url: string,
  pic: string,
  lrc: string;
}