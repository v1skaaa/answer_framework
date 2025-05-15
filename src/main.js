import {
	createSSRApp
} from "vue";
import App from "./App.vue";

// 引入uni-ui组件
import uniIcons from '@dcloudio/uni-ui/lib/uni-icons/uni-icons.vue'

// 导入KaTeX样式
import 'katex/dist/katex.min.css';

export function createApp() {
	const app = createSSRApp(App);
	
	// 注册全局组件
	app.component('uni-icons', uniIcons);
	
	return {
		app,
	};
}
