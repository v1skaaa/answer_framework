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
          
          // 渲染完成后，确保 chtml 公式能够换行
          this.$nextTick(() => {
            this.ensureFormulaWrapping();
          });
          
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
    
    // 确保公式换行的方法
    ensureFormulaWrapping() {
      const element = document.getElementById(this.mathId);
      if (!element) return;
      
      // 查找所有 chtml 渲染的数学容器
      const chtmlContainers = element.querySelectorAll('mjx-container[jax="CHTML"]');
      
      chtmlContainers.forEach(container => {
        // 设置容器的样式确保换行
        container.style.maxWidth = '100%';
        container.style.wordWrap = 'break-word';
        container.style.overflowWrap = 'break-word';
        container.style.whiteSpace = 'normal';
        container.style.display = 'inline-block';
        
        // 处理内部的数学元素
        const mathElements = container.querySelectorAll('mjx-math, mjx-chtml, mjx-mrow, mjx-mo, mjx-mn, mjx-mi, mjx-msup, mjx-msub, mjx-mfrac, mjx-msqrt, mjx-mroot');
        mathElements.forEach(mathEl => {
          mathEl.style.maxWidth = '100%';
          mathEl.style.wordWrap = 'break-word';
          mathEl.style.overflowWrap = 'break-word';
          mathEl.style.whiteSpace = 'normal';
          mathEl.style.display = 'inline-block';
        });
        
        // 特别处理长公式的行
        const mrows = container.querySelectorAll('mjx-mrow');
        mrows.forEach(mrow => {
          mrow.style.maxWidth = '100%';
          mrow.style.wordWrap = 'break-word';
          mrow.style.overflowWrap = 'break-word';
          mrow.style.whiteSpace = 'normal';
          mrow.style.display = 'inline-block';
          
          // 检查行是否过长
          if (mrow.scrollWidth > mrow.clientWidth) {
            mrow.style.flexWrap = 'wrap';
            mrow.style.alignItems = 'flex-start';
          }
        });
        
        // 处理分数
        const fractions = container.querySelectorAll('mjx-mfrac');
        fractions.forEach(frac => {
          frac.style.maxWidth = '100%';
          frac.style.wordWrap = 'break-word';
          frac.style.overflowWrap = 'break-word';
          frac.style.whiteSpace = 'normal';
        });
        
        // 处理根号
        const roots = container.querySelectorAll('mjx-msqrt, mjx-mroot');
        roots.forEach(root => {
          root.style.maxWidth = '100%';
          root.style.wordWrap = 'break-word';
          root.style.overflowWrap = 'break-word';
          root.style.whiteSpace = 'normal';
        });
      });
      
      // 延迟再次检查，确保所有元素都已渲染
      setTimeout(() => {
        this.finalizeFormulaWrapping();
      }, 100);
    },
    
    // 最终确认换行处理
    finalizeFormulaWrapping() {
      const element = document.getElementById(this.mathId);
      if (!element) return;
      
      const containers = element.querySelectorAll('mjx-container');
      containers.forEach(container => {
        // 强制重新计算布局
        container.style.maxWidth = '100%';
        container.style.wordWrap = 'break-word';
        container.style.overflowWrap = 'break-word';
        container.style.whiteSpace = 'normal';
        
        // 处理所有子元素
        const allElements = container.querySelectorAll('*');
        allElements.forEach(el => {
          if (el.scrollWidth > el.clientWidth) {
            el.style.maxWidth = '100%';
            el.style.wordWrap = 'break-word';
            el.style.overflowWrap = 'break-word';
            el.style.whiteSpace = 'normal';
          }
        });
      });
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
  max-width: 100%;
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

/* chtml 渲染的公式换行样式 */
.math-content mjx-container {
  overflow: hidden;
  margin: 0px;
  max-width: 100% !important;
  word-wrap: break-word !important;
  overflow-wrap: break-word !important;
}

/* 强制长公式换行 */
.math-content mjx-math {
  white-space: normal !important;
  max-width: 100% !important;
  word-wrap: break-word !important;
  overflow-wrap: break-word !important;
  display: inline-block !important;
}

/* chtml 渲染的数学内容换行 */
.math-content mjx-chtml {
  letter-spacing: -0.5px; /* 微调字符间距 */
  max-width: 100% !important;
  word-wrap: break-word !important;
  overflow-wrap: break-word !important;
  white-space: normal !important;
}

/* 针对 chtml 渲染的容器 */
.math-content mjx-container[jax="CHTML"] {
  max-width: 100% !important;
  word-wrap: break-word !important;
  overflow-wrap: break-word !important;
}

/* 针对 chtml 渲染的数学表达式 */
.math-content mjx-container[jax="CHTML"] mjx-math {
  max-width: 100% !important;
  word-wrap: break-word !important;
  overflow-wrap: break-word !important;
  white-space: normal !important;
}

/* 针对 chtml 渲染的数学内容 */
.math-content mjx-container[jax="CHTML"] mjx-chtml {
  max-width: 100% !important;
  word-wrap: break-word !important;
  overflow-wrap: break-word !important;
  white-space: normal !important;
}

/* 处理长公式的换行 */
.math-content mjx-container[jax="CHTML"] mjx-chtml mjx-mrow {
  max-width: 100% !important;
  word-wrap: break-word !important;
  overflow-wrap: break-word !important;
  white-space: normal !important;
}

/* 确保所有数学元素都能换行 */
.math-content mjx-container[jax="CHTML"] * {
  max-width: 100% !important;
  word-wrap: break-word !important;
  overflow-wrap: break-word !important;
}

/* 全局 chtml 换行样式 */
:deep(mjx-container[jax="CHTML"]) {
  max-width: 100% !important;
  word-wrap: break-word !important;
  overflow-wrap: break-word !important;
  white-space: normal !important;
}

:deep(mjx-container[jax="CHTML"] mjx-math) {
  max-width: 100% !important;
  word-wrap: break-word !important;
  overflow-wrap: break-word !important;
  white-space: normal !important;
  display: inline-block !important;
}

:deep(mjx-container[jax="CHTML"] mjx-chtml) {
  max-width: 100% !important;
  word-wrap: break-word !important;
  overflow-wrap: break-word !important;
  white-space: normal !important;
}

:deep(mjx-container[jax="CHTML"] mjx-mrow) {
  max-width: 100% !important;
  word-wrap: break-word !important;
  overflow-wrap: break-word !important;
  white-space: normal !important;
  display: inline-block !important;
}

/* 处理长公式的强制换行 */
:deep(mjx-container[jax="CHTML"] mjx-mrow[style*="overflow"]) {
  flex-wrap: wrap !important;
  align-items: flex-start !important;
}

mjx-container[jax="SVG"][display="true"]{
  margin:0px;
}

:deep(.MathJax > svg) {
  max-width: 100% !important;
}
</style>