import { BOOTSTRAPPING, NOT_MOUNTED, NOT_BOOTSTRAPPED} from '../application/helper'

// 启动的函数
export async function toBootstrapPromise(app){
  // 只有处在NOT_BOOTSTRAPPED还未启动的状态才能够启动
  if(app.status !== NOT_BOOTSTRAPPED){
    return app
  }
  // 修改状态为启动中
  app.status = BOOTSTRAPPING
  // 调用用户传递过来的启动函数
  await app.bootstrap(app.customProps)
  // 修改状态为还未挂载
  app.status = NOT_MOUNTED
  return app
}