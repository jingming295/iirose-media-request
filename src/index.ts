import { Context, Schema } from 'koishi'

export * from './api/MsgHandle'

export const name = 'iirose-media-request'

export interface Config {}

export const Config: Schema<Config> = Schema.object({})
