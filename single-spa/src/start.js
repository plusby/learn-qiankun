import { reRoute } from './navigations/reRoute'

export let started = false

// 启动移动
export function start(){
  started = true 
  reRoute()
}