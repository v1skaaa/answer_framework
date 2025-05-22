import {
	createSSRApp
} from "vue";
import App from "./App.vue";

// 引入uni-ui组件
import uniIcons from '@dcloudio/uni-ui/lib/uni-icons/uni-icons.vue'

// 全局引入MathJax
// 这里不需要直接导入css，MathJax使用SVG渲染

export function createApp() {
	const app = createSSRApp(App);
	
	// 注册全局组件
	app.component('uni-icons', uniIcons);
	
	return {
		app,
	};
}
