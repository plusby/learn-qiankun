import { reRoute } from './reRoute'

export const events = [ 'hashchange', 'popstate']

function urlReroute(){
  // console.log('arguments',arguments)
  reRoute([],arguments)
}

const captureEventListener = {
  hashchange: [],
  popstate: [],
}

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

window.addEventListener('hashchange', urlReroute)
window.addEventListener('popstate', urlReroute)

// 保存原生的事件
const originalAddEventListener = window.addEventListener
const originalRemoveEventListener = window.removeEventListener

// 重写addEventListener
window.addEventListener = function(eventName, fn){
  console.log(eventName)
  // 是hashchange或popstate事件，不存在就存入数组中
  if(events.indexOf(eventName) !== -1 && !captureEventListener[eventName].some(item=>item===fn)){
    captureEventListener[eventName].push(fn)
  }
  // 使用原生事件进行执行监听
  return originalAddEventListener.apply(this,arguments)
}

// 重写removeEventListener
window.removeEventListener = function(eventName, fn){
  if(events.indexOf(eventName) !== -1){
    captureEventListener[eventName] = captureEventListener[eventName].filter(item=>item!==fn)
  }
  return originalRemoveEventListener.apply(this,arguments)
}

// 实现通过pushState或replaceState改变地址时加载相应的应用
function patchUpdateState(event, name){
  return function(){
    console.log(name)
    // 获取url改变之前的值
    const urlBefore = window.location.href
    // 调用H5 history的方法切换地址
    event.apply(this,arguments)
    // 获取切换之后的地址
    const urlAfter = window.location.href
    // 前后两个地址不一样 就重新加载应用
    if(urlBefore!==urlAfter ){
      urlReroute(new PopStateEvent('popState'))
    }
  }
}

/*
  重写replaceState和pushState
  因为replaceState和pushState只能使得地址栏的地址发生改变，但是页面并不会跟着改变并且不能被popstate监听到，因此
  重写这两个方法，再修改地址之后就执行页面的改变
*/
window.history.replaceState = patchUpdateState(window.history.replaceState, 'replaceState')
window.history.pushState = patchUpdateState(window.history.pushState, 'pushState')
