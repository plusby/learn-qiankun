import { LOADING_SOURCE_CODE, NOT_BOOTSTRAPPED } from '../application/helper'

// 扁平化数组函数
function flattenFnArray(fns){
  fns = Array.isArray(fns) ? fns : [fns]
  return (props)=>{
    return fns.reduce((last,fn)=>{ // 通过reduce配合promise实现连续执行数组中的每一项
      return last.then(()=>{
        return fn(props)
      })
    },Promise.resolve())
  }
}

// 加载应用
export function toLoadPromise(app){
  if(app.isLoadPromise){
    return app.isLoadPromise
  }
  return (app.isLoadPromise = (() => {
    app.status = LOADING_SOURCE_CODE // 修改状态为加载资源
    const { bootstrap, mount, unmount } = app.loadApp(app.customProps) // 获取到应用中的声明周期方法
    app.status = NOT_BOOTSTRAPPED // 修改状态为 还未调用bootstrap方法
    // 扁平化各个生命周期中的数组函数并且挂载到应用对象上
    app.bootstrap = flattenFnArray(bootstrap)
    app.mount = flattenFnArray(mount)
    app.unmount = flattenFnArray(unmount)
    return app
  })())
}