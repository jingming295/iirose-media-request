interface DistTags {
    latest: string;
    // 可以添加其他你需要描述的属性
  }
  
  interface NpmData {
    // 其他属性...
    'dist-tags': DistTags;
    // 可以添加其他你需要描述的属性
  }