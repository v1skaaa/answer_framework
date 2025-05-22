<template>
  <view class="mathjax-container">
    <image 
      :src="imageUrl" 
      :style="{ transform: `scale(${scale})` }"
      mode="widthFix"
      @error="onImageError"
    ></image>
    <view v-if="error" class="error-text">{{ error }}</view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  formula: {     //必传LaTeX公式
    type: String,
    required: true
  },
  displayMode: {    //是否块级公式（默认行内）
    type: Boolean,
    default: false
  },
  scale: {        //图片缩放比例
    type: Number,
    default: 0.85
  }
});

const error = ref('');

// 使用CodeCogs API生成公式图片URL
const imageUrl = computed(() => {
  try {
    // 编码公式并替换某些特殊字符
    let encodedFormula = encodeURIComponent(props.formula);
    
    // 使用CodeCogs API生成LaTeX公式图片
    const mode = props.displayMode ? '\\displaystyle ' : '';
    return `https://latex.codecogs.com/svg.image?${mode}${encodedFormula}`;
  } catch (e) {
    error.value = '公式编码错误';
    return '';
  }
});

// 图片加载失败
const onImageError = () => {
  error.value = '公式加载失败';
};
</script>

<style>
.mathjax-container {
  display: inline-block;
  vertical-align: middle;
  transform-origin: left center;
}

.error-text {
  color: red;
  font-size: 12px;
}
</style> 