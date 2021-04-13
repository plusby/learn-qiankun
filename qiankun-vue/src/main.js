import Vue from 'vue'
import App from './App.vue'
import router from './router'

Vue.config.productionTip = false


let instance = null 
function render(props){
  instance = new Vue({
    router,
    render: h => h(App),
  }).$mount('#app2')
}

console.log(window.__POWERED_BY_QIANKUN__)
// webpack打包公共文件路径
if (window.__POWERED_BY_QIANKUN__) {
  __webpack_public_path__ = window.__INJECTED_PUBLIC_PATH_BY_QIANKUN__;
}
// 独立运行
if (!window.__POWERED_BY_QIANKUN__) {
  render();
}

// qiankun下的子应用必须导出以下三个函数
// bootstrap 只会在微应用初始化的时候调用一次，下次微应用重新进入时会直接调用 mount 钩子，不会再重复触发 bootstrap。
export async function bootstrap(){

}

// 挂载的时候  应用每次进入都会调用 mount 方法，通常我们在这里触发应用的渲染方法
export async function mount(props){
  render(props)
}

// 卸载的时候  应用每次 切出/卸载 会调用的方法，通常在这里我们会卸载微应用的应用实例
export async function unmount(props){
  instance.$destroy()
}

