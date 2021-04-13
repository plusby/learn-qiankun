import { UNMOUNTING, MOUNTED, MOUNTING } from '../application/helper'


// 卸载时候执行的函数(主要是修改应用的状态和执行用户传递过来的卸载的函数)
export async function appToUnMountPromise(app){
  // 还没有挂载完毕不能进行卸载
  if(app.status !== MOUNTED){
    return app
  }
  // 修改状态为正在挂载中
  app.status = MOUNTING
  // 执行传递过来的卸载函数
  await app.unmount(app.customProps)
  // 修改状态为卸载
  app.status = UNMOUNTING
  app.isLoadPromise = null
  return app

}