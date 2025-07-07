import {
    createSSRApp
} from "vue";
import App from "./App.vue";
import { createPinia } from 'pinia';
// 引入uni-ui组件
import uniIcons from '@dcloudio/uni-ui/lib/uni-icons/uni-icons.vue'

// 配置 MathJax (仅在 H5 端)
const configureMathJax = () => {
    // #ifdef H5
    if (typeof window !== 'undefined') {
        window.MathJax = {
            tex: {
                inlineMath: [['$', '$'], ['\\(', '\\)']],
                displayMath: [['$$', '$$'], ['\\[', '\\]']],
                processEscapes: true,
                processEnvironments: true,
                packages: {
                    '[+]': ['ams', 'boldsymbol', 'color', 'physics', 'mhchem']
                },
                tags: 'ams',
                macros: {
                    boldsymbol: ['\\mathbf{#1}', 1],
                    vec: ['\\mathbf{#1}', 1],
                    degree: '^\\circ'
                }
            },
            options: {
                skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre'],
                ignoreHtmlClass: 'tex2jax_ignore',
                processHtmlClass: 'tex2jax_process',
                renderActions: {
                    find: [10, function (doc) {
                        doc.findMath();
                    }]
                }
            },
            startup: {
                ready() {
                    console.log('MathJax 启动中...');
                    if (window.MathJax.startup.defaultReady) {
                        window.MathJax.startup.defaultReady();
                    }
                    window.mathJaxReady = true;
                    window.dispatchEvent(new CustomEvent('mathjax-loaded'));
                    console.log('MathJax 加载完成');
                }
            },
            svg: {
                fontCache: 'global'
            },
            loader: {
                load: ['[tex]/ams', '[tex]/boldsymbol', '[tex]/color', '[tex]/physics', '[tex]/mhchem']
            },
            chtml: {
                displayAlign: 'left',
                displayIndent: '0em',
                scale: 1,
                matchFontHeight: true,
                mtextInheritFont: true,
            }
        };
        
        // 动态加载 MathJax
        const script = document.createElement('script');
        // script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js';
        // script.src = '/static/mathjax.js';
        script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js';
        script.async = true;
        script.id = 'MathJax-script';
        document.head.appendChild(script);
    }
    // #endif
};

export function createApp() {
    const app = createSSRApp(App);
    
    // 创建 Pinia 实例
    const pinia = createPinia();
    
    // 将 Pinia 安装到应用中
    app.use(pinia);
    
    // 注册全局组件
    app.component('uni-icons', uniIcons);
    
    // 配置 MathJax
    configureMathJax();
    
    return {
        app,
    };
}