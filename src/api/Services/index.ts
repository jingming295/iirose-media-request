import { Context, Service } from "koishi";

declare module 'koishi' {
    interface Context {
        iirose_media_request: iirose_media_request;
    }
  }
  export class iirose_media_request extends Service{

    constructor(ctx: Context) {
        // 这样写你就不需要手动给 ctx 赋值了
        super(ctx, 'iirose_media_request', true)
    }
  }
