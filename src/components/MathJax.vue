<template>
  <view class="mathjax-container">
    <view 
      :id="mathId" 
      class="math-content"
      :style="containerStyle"
      v-html="processedFormula"
    >
    </view>
    <view v-if="error" class="error-text">{{ error }}</view>
    <view v-if="loading" class="loading-text">加载中...</view>
  </view>
</template>

<script>
export default {
  name: 'MathJax',
  props: {
    formula: {
      type: String,
      required: true
    },
    displayMode: {
      type: Boolean,
      default: false
    },
    scale: {
      type: Number,
      default: 1
    }
  },
  data() {
    return {
      error: '',
      loading: false,
      mathId: `math-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      renderTimer: null,
      isReady: false
    };
  },
  computed: {
    containerStyle() {
      return {
        transform: `scale(${this.scale})`,
        transformOrigin: 'left center',
        display: 'inline-block'
      };
    },
    processedFormula() {
    if (!this.formula) return '';
    let processed = this.formula;
    
    // 处理双反斜杠转义
    processed = processed.replace(/\\\\/g, '\\');
    
    // 关键修改：将 \\( 和 \\) 统一转换为 $
    processed = processed
      .replace(/\\\(/g, '$')  // 替换 \\( 为 $
      .replace(/\\\)/g, '$'); // 替换 \\) 为 $

    // 根据 displayMode 包装公式
    if (this.displayMode) {
      // Display mode: 使用 $$
      if (!processed.startsWith('$$') && !processed.endsWith('$$')) {
        processed = `$$${processed}$$`;
      }
    } else {
      // Inline mode: 使用单个 $
      if (!processed.startsWith('$') || processed.startsWith('$$')) {
        // 移除可能存在的 $$ 包装
        processed = processed.replace(/^\$\$|\$\$$/g, '');
        // 添加单个 $ 包装
        processed = `$${processed}$`;
      }
    }
    
    // console.log('原始公式:', this.formula);
    // console.log('显示模式:', this.displayMode);
    // console.log('处理后公式:', processed);
    
    return processed;
  }
  },
  watch: {
    formula: {
      handler(newVal, oldVal) {
        if (newVal !== oldVal) {
          // console.log('公式变化:', oldVal, '->', newVal);
          this.debouncedRender();
        }
      },
      immediate: true
    },
    displayMode: {
      handler() {
        this.debouncedRender();
      }
    }
  },
  mounted() {
    console.log('MathJax组件挂载:', {
      formula: this.formula,
      displayMode: this.displayMode,
      scale: this.scale
    });
    
    // #ifdef H5
    this.initMathJax();
    // #endif
    
    // #ifndef H5
    this.error = '当前平台不支持MathJax渲染';
    console.warn('非H5平台，MathJax不可用');
    // #endif
  },
  beforeDestroy() {
    if (this.renderTimer) {
      clearTimeout(this.renderTimer);
    }
    // #ifdef H5
    if (typeof window !== 'undefined') {
      window.removeEventListener('mathjax-loaded', this.onMathJaxLoaded);
    }
    // #endif
  },
  methods: {
    initMathJax() {
      // #ifdef H5
      if (typeof window === 'undefined') {
        this.error = '非浏览器环境';
        return;
      }
      
      if (window.mathJaxReady && window.MathJax && window.MathJax.typesetPromise) {
        console.log('MathJax已准备就绪，立即渲染');
        this.isReady = true;
        this.renderMath();
      } else {
        console.log('等待MathJax加载...');
        window.addEventListener('mathjax-loaded', this.onMathJaxLoaded);
        this.waitForMathJax();
      }
      // #endif
    },
    
    onMathJaxLoaded() {
      console.log('收到MathJax加载完成事件');
      this.isReady = true;
      this.renderMath();
    },
    
    waitForMathJax() {
      let attempts = 0;
      const maxAttempts = 100;
      
      const check = () => {
        attempts++;
        
        if (window.mathJaxReady && window.MathJax && window.MathJax.typesetPromise) {
          console.log(`MathJax检查成功 (第${attempts}次)`);
          this.isReady = true;
          this.renderMath();
        } else if (attempts >= maxAttempts) {
          console.error('MathJax加载超时');
          this.error = 'MathJax加载超时，请刷新页面重试';
        } else {
          setTimeout(check, 100);
        }
      };
      
      check();
    },
    
    async renderMath() {
      // #ifdef H5
      if (!this.isReady || !this.formula || typeof window === 'undefined') {
        console.log('渲染条件不满足:', {
          isReady: this.isReady,
          hasFormula: !!this.formula,
          hasWindow: typeof window !== 'undefined'
        });
        return;
      }
      
      this.loading = true;
      
      await this.$nextTick();
      
      try {
        this.error = '';
        
        const element = document.getElementById(this.mathId);
        if (!element) {
          console.error('找不到渲染元素:', this.mathId);
          this.error = '渲染元素未找到';
          return;
        }
        
        if (window.MathJax && window.MathJax.typesetPromise) {
          console.log('开始渲染公式:', this.processedFormula);
          
          // 清除之前的渲染结果
          if (window.MathJax.typesetClear) {
            window.MathJax.typesetClear([element]);
          }
          
          // 重新渲染
          await window.MathJax.typesetPromise([element]);
          console.log('✅ 公式渲染成功');
          
        } else {
          console.warn('MathJax 或 typesetPromise 不可用');
          this.error = 'MathJax未正确加载';
        }
        
      } catch (error) {
        console.error('❌ 数学公式渲染失败:', error);
        this.error = '公式渲染失败: ' + error.message;
      } finally {
        this.loading = false;
      }
      // #endif
    },
    
    debouncedRender() {
      if (this.renderTimer) {
        clearTimeout(this.renderTimer);
      }
      this.renderTimer = setTimeout(() => {
        this.renderMath();
      }, 300);
    }
  }
};
</script>

<style scoped>
.mathjax-container {
  display: inline-block;
  vertical-align: middle;
}

.math-content {
  /* min-height: 1em; */
  /* line-height: 1.5; */
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.error-text {
  color: #ff4757;
  font-size: 24rpx;
  margin-top: 8rpx;
  padding: 4rpx 8rpx;
  background-color: #fff1f0;
  border-radius: 4rpx;
}

.loading-text {
  color: #666;
  font-size: 24rpx;
  margin-top: 8rpx;
}

.math-content mjx-container {
    overflow: hidden;
    margin:0px;
}
.mjx-chtml {
    letter-spacing: -0.5px; /* 微调字符间距 */
}

mjx-container[jax="SVG"][display="true"]{
  margin:0px;
}
</style>