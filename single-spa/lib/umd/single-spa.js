(function (factory) {
  typeof define === 'function' && define.amd ? define(factory) :
  factory();
}((function () { 'use strict';

  const NOT_LOADED = 'NOT_LOADED'; // 应用初始状态
  const LOADING_SOURCE_CODE = 'LOADING_SOURCE_CODE'; // 加载资源
  const NOT_BOOTSTRAPPED = 'NOT_BOOTSTRAPPED'; // 还未调用bootstrap方法
  const BOOTSTRAPPING = 'BOOTSTRAPPING'; // 启动中
  const NOT_MOUNTED = 'NOT_MOUNTED'; // 还没有调用mount方法
  const MOUNTING = 'MOUNTING'; // 正在挂载中
  const MOUNTED = 'MOUNTED'; // 挂载完毕
  const UNMOUNTING = 'UNMOUNTING'; // 解除挂载

  // 当前这个应用是否要被激活
  function shouldBeActive(app){ // 返回true 那么应用应该就开始初始化等一系列操作
    return app.activeWhen(window.location) // 根据路径判断是否包含指定的路径，包含就激活当前应用
  }

  let started = false;

  // 启动移动
  function start(){
    started = true; 
    reRoute();
  }

  // 扁平化数组函数
  function flattenFnArray(fns){
    fns = Array.isArray(fns) ? fns : [fns];
    return (props)=>{
      return fns.reduce((last,fn)=>{ // 通过reduce配合promise实现连续执行数组中的每一项
        return last.then(()=>{
          return fn(props)
        })
      },Promise.resolve())
    }
  }

  // 加载应用
  function toLoadPromise(app){
    if(app.isLoadPromise){
      return app.isLoadPromise
    }
    return (app.isLoadPromise = (() => {
      app.status = LOADING_SOURCE_CODE; // 修改状态为加载资源
      const { bootstrap, mount, unmount } = app.loadApp(app.customProps); // 获取到应用中的声明周期方法
      app.status = NOT_BOOTSTRAPPED; // 修改状态为 还未调用bootstrap方法
      // 扁平化各个生命周期中的数组函数并且挂载到应用对象上
      app.bootstrap = flattenFnArray(bootstrap);
      app.mount = flattenFnArray(mount);
      app.unmount = flattenFnArray(unmount);
      return app
    })())
  }

  // 卸载时候执行的函数(主要是修改应用的状态和执行用户传递过来的卸载的函数)
  async function appToUnMountPromise(app){
    // 还没有挂载完毕不能进行卸载
    if(app.status !== MOUNTED){
      return app
    }
    // 修改状态为正在挂载中
    app.status = MOUNTING;
    // 执行传递过来的卸载函数
    await app.unmount(app.customProps);
    // 修改状态为卸载
    app.status = UNMOUNTING;
    app.isLoadPromise = null;
    return app

  }

  // 启动的函数
  async function toBootstrapPromise(app){
    // 只有处在NOT_BOOTSTRAPPED还未启动的状态才能够启动
    if(app.status !== NOT_BOOTSTRAPPED){
      return app
    }
    // 修改状态为启动中
    app.status = BOOTSTRAPPING;
    // 调用用户传递过来的启动函数
    await app.bootstrap(app.customProps);
    // 修改状态为还未挂载
    app.status = NOT_MOUNTED;
    return app
  }

  // 挂载应用
  async function toMountPromise(app){
    // 只有还没有挂载的状态才能进行挂载
    if(app.status !== 'NOT_MOUNTED'){
      return app
    }
    // 修改状态为挂载中
    app.status = MOUNTING;
    // 调用用户传递的挂载的函数
    await app.mount(app.customProps);
    // 修改状态为挂载完毕
    app.status = MOUNTED;
    return app
  }

  const events = [ 'hashchange', 'popstate'];

  function urlReroute(){
    // console.log('arguments',arguments)
    reRoute();
  }

  const captureEventListener = {
    hashchange: [],
    popstate: [],
  };

  /*
    popstate
    每当同一个文档的浏览历史（即history对象）出现变化时，就会触发popstate事件
    只有用户点击浏览器倒退按钮和前进按钮，或者使用 JavaScript 调用History.back()、
    History.forward()、History.go()方法时才会触发。另外，该事件只针对同一个文档，
    如果浏览历史的切换，导致加载不同的文档，该事件也不会触发。

    注意，仅仅调用pushState()方法或replaceState()方法 ，并不会触发该事件
        该事件只针对同一个文档，如果浏览历史的切换，导致加载不同的文档，该事件也不会触发。

    hashchange和popstate的区别：
     hashchange是老的api只能监听hash的变化，popstate是h5的history新的api,它不仅可以监听hash还可以监听非hash的同源url，
     所以一般用法是浏览器支持就用popstate, 不支持再降级使用hashchange

    hashchange和popstate都写了，如果是hash的改变，那么先触发popstate再触发hashchange
  */

  window.addEventListener('hashchange', urlReroute);
  window.addEventListener('popstate', urlReroute);

  // 保存原生的事件
  const originalAddEventListener = window.addEventListener;
  const originalRemoveEventListener = window.removeEventListener;

  // 重写addEventListener
  window.addEventListener = function(eventName, fn){
    console.log(eventName);
    // 是hashchange或popstate事件，不存在就存入数组中
    if(events.indexOf(eventName) !== -1 && !captureEventListener[eventName].some(item=>item===fn)){
      captureEventListener[eventName].push(fn);
    }
    // 使用原生事件进行执行监听
    return originalAddEventListener.apply(this,arguments)
  };

  // 重写removeEventListener
  window.removeEventListener = function(eventName, fn){
    if(events.indexOf(eventName) !== -1){
      captureEventListener[eventName] = captureEventListener[eventName].filter(item=>item!==fn);
    }
    return originalRemoveEventListener.apply(this,arguments)
  };

  // 实现通过pushState或replaceState改变地址时加载相应的应用
  function patchUpdateState(event, name){
    return function(){
      console.log(name);
      // 获取url改变之前的值
      const urlBefore = window.location.href;
      // 调用H5 history的方法切换地址
      event.apply(this,arguments);
      // 获取切换之后的地址
      const urlAfter = window.location.href;
      // 前后两个地址不一样 就重新加载应用
      if(urlBefore!==urlAfter ){
        urlReroute(new PopStateEvent('popState'));
      }
    }
  }

  /*
    重写replaceState和pushState
    因为replaceState和pushState只能使得地址栏的地址发生改变，但是页面并不会跟着改变并且不能被popstate监听到，因此
    重写这两个方法，再修改地址之后就执行页面的改变
  */
  window.history.replaceState = patchUpdateState(window.history.replaceState, 'replaceState');
  window.history.pushState = patchUpdateState(window.history.pushState, 'pushState');

  function reRoute(){
    // 检查应用的状态 获取到不同阶段的应用
    const { appToLoad, appToMount, appToUnMount} = getAppStatusChange();
    console.log(started,appToLoad, appToMount, appToUnMount);

    if (started) { // 已经启动的应用
      return performAppChange() // 根据路径装载应用
    } else { // 注册应用
      return loadApp() // 预加载应用
    }

    // 预加载应用
    async function loadApp(){
      // 修改各个应用的状态并且扁平化应用中的生命周期的函数数组
      await Promise.all(appToLoad.map(toLoadPromise));
    }

    // 根据路径装载应用
    async function performAppChange(){
      // 先把之前的应用进行卸载
      await appToUnMount.map(appToUnMountPromise);
      // 再进行加载
      appToLoad.map(async (app)=>{
        // 加载应用为把应用中的声明构造函数进行扁平化处理并且放在应用对应的属性上
        app = await toLoadPromise(app);
        // 启动
        app = await toBootstrapPromise(app);
        // 挂载
        return await toMountPromise(app)
      });

      // 有的一开始就加载了需要直接挂载(各个阶段的函数是根据状态进行执行的)
      appToMount.map(async (app)=>{
        // 启动
        app = await toBootstrapPromise(app);
        // 挂载
        return await toMountPromise(app)
      });
    }   
  }

  /*
    @params {*} appName 应用名称
    @params {*} loadApp 加载的应用
    @params {*} activeWhen 当激活时调用的 loadApp
    @params {*} customProps 用户自定义属性
  */

  const apps = []; // 存放所有的应用

  // 维护应用所有的状态
  function registerApplication(appName, loadApp, activeWhen, customProps){
    apps.push({
      name: appName,
      loadApp,
      activeWhen,
      customProps,
      status: NOT_LOADED
    });
    // 挂载
    reRoute();
  }

  // app的状态改变
  function getAppStatusChange(){
    const appToLoad = []; // 需要被加载的app
    const appToMount = []; // 需要被挂载的app
    const appToUnMount = []; // 需要被卸载的app
    console.log('apps',apps);
    apps.forEach(app=>{
      // 当前这个应用是否要被激活
      const isActive = shouldBeActive(app);
      switch(app.status){
        case NOT_LOADED: // 应用初始状态或加载资源状态时这个应用应该被存放到需要被加载的app中
        case LOADING_SOURCE_CODE:
        case UNMOUNTING:
          if(isActive){
            appToLoad.push(app);
          }
          break
        case NOT_BOOTSTRAPPED: // 还未调用bootstrap方法、启动中、还没有调用mount方法的状态的子应用 这个应用被存放到需要被挂载的app中
        case BOOTSTRAPPING:
        case NOT_MOUNTED:
          if(isActive){
            appToMount.push(app);
          }
          break
        case MOUNTED: // 已经挂载了下一步这个应该就是被卸载
          if(!isActive){
            appToUnMount.push(app);
          }
          break
      }
    });
    
    return {
      appToLoad,
      appToMount,
      appToUnMount
    }
  }

  window.singleSpa = {
    registerApplication,
    start
  };

})));
//# sourceMappingURL=single-spa.js.map
