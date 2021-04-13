import { started } from '../start'
import { getAppStatusChange } from '../application/app'
import { toLoadPromise } from '../lifecycles/load'
import { appToUnMountPromise } from '../lifecycles/unMount'
import { toBootstrapPromise } from '../lifecycles/bootstrap'
import { toMountPromise } from '../lifecycles/mount'
import './nav-events'

export function reRoute(){
  // 检查应用的状态 获取到不同阶段的应用
  const { appToLoad, appToMount, appToUnMount} = getAppStatusChange()
  console.log(started,appToLoad, appToMount, appToUnMount)

  if (started) { // 已经启动的应用
    return performAppChange() // 根据路径装载应用
  } else { // 注册应用
    return loadApp() // 预加载应用
  }

  // 预加载应用
  async function loadApp(){
    // 修改各个应用的状态并且扁平化应用中的生命周期的函数数组
    let apps = await Promise.all(appToLoad.map(toLoadPromise))
  }

  // 根据路径装载应用
  async function performAppChange(){
    // 先把之前的应用进行卸载
    const unmountPromises = await appToUnMount.map(appToUnMountPromise)
    // 再进行加载
    appToLoad.map(async (app)=>{
      // 加载应用为把应用中的声明构造函数进行扁平化处理并且放在应用对应的属性上
      app = await toLoadPromise(app)
      // 启动
      app = await toBootstrapPromise(app)
      // 挂载
      return await toMountPromise(app)
    })

    // 有的一开始就加载了需要直接挂载(各个阶段的函数是根据状态进行执行的)
    appToMount.map(async (app)=>{
      // 启动
      app = await toBootstrapPromise(app)
      // 挂载
      return await toMountPromise(app)
    })
  }   
}

