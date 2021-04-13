import { NOT_LOADED, LOADING_SOURCE_CODE, NOT_BOOTSTRAPPED, BOOTSTRAPPING, NOT_MOUNTED, MOUNTING, MOUNTED, UNMOUNTING, shouldBeActive } from './helper'
import { reRoute } from '../navigations/reRoute'

/*
  @params {*} appName 应用名称
  @params {*} loadApp 加载的应用
  @params {*} activeWhen 当激活时调用的 loadApp
  @params {*} customProps 用户自定义属性
*/

const apps = [] // 存放所有的应用

// 维护应用所有的状态
export function registerApplication(appName, loadApp, activeWhen, customProps){
  apps.push({
    name: appName,
    loadApp,
    activeWhen,
    customProps,
    status: NOT_LOADED
  })
  // 挂载
  reRoute()
}

// app的状态改变
export function getAppStatusChange(){
  const appToLoad = [] // 需要被加载的app
  const appToMount = [] // 需要被挂载的app
  const appToUnMount = [] // 需要被卸载的app
  console.log('apps',apps)
  apps.forEach(app=>{
    // 当前这个应用是否要被激活
    const isActive = shouldBeActive(app)
    switch(app.status){
      case NOT_LOADED: // 应用初始状态或加载资源状态时这个应用应该被存放到需要被加载的app中
      case LOADING_SOURCE_CODE:
      case UNMOUNTING:
        if(isActive){
          appToLoad.push(app)
        }
        break
      case NOT_BOOTSTRAPPED: // 还未调用bootstrap方法、启动中、还没有调用mount方法的状态的子应用 这个应用被存放到需要被挂载的app中
      case BOOTSTRAPPING:
      case NOT_MOUNTED:
        if(isActive){
          appToMount.push(app)
        }
        break
      case MOUNTED: // 已经挂载了下一步这个应该就是被卸载
        if(!isActive){
          appToUnMount.push(app)
        }
        break
    }
  })
  
  return {
    appToLoad,
    appToMount,
    appToUnMount
  }
}


