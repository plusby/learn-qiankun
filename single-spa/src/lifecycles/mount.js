import { MOUNTING, MOUNTED, NOT_MOUNTED} from '../application/helper'

// 挂载应用
export async function toMountPromise(app){
  // 只有还没有挂载的状态才能进行挂载
  if(app.status !== 'NOT_MOUNTED'){
    return app
  }
  // 修改状态为挂载中
  app.status = MOUNTING
  // 调用用户传递的挂载的函数
  await app.mount(app.customProps)
  // 修改状态为挂载完毕
  app.status = MOUNTED
  return app
}