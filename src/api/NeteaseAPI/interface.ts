interface ParamsObject
{
  s: string;
  type: number;
  limit: number;
  offset: number;
}

interface SearchSimpleAlbumParamsObject
{
  albumId: string;
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

interface DataObject
{
  albumId: string;
  header: Header;
}
/**
 * 专辑
 */
 interface Album {
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

interface Artist {
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

interface Song {
  songId: number;
  songName: string;
  artistRepVos:Artist[]
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
interface MusicDetail {
  songs: MusicDetailSong[];
  equalizers: string; // 这里是一个键值对，值的类型未知，可以根据需要修改
  code: number;
}

interface MusicDetailSong {
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
  album: Album;
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

interface MusicDetailArtists {
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

interface Album {
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

interface MusicFormat {
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



