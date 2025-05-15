<template>
  <view class="latex-container" v-html="renderedFormula"></view>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import katex from 'katex';
import 'katex/dist/katex.min.css';

const props = defineProps({
  formula: {
    type: String,
    required: true
  },
  displayMode: {
    type: Boolean,
    default: false
  }
});

const renderedFormula = ref('');

const renderFormula = () => {
  try {
    renderedFormula.value = katex.renderToString(props.formula, {
      throwOnError: false,
      displayMode: props.displayMode
    });
  } catch (error) {
    console.error('LaTeX渲染错误:', error);
    renderedFormula.value = `<span style="color: red;">LaTeX错误: ${error.message}</span>`;
  }
};

onMounted(() => {
  renderFormula();
});

watch(() => props.formula, () => {
  renderFormula();
});
</script>

<style>
.latex-container {
  display: inline-block;
  max-width: 100%;
  overflow-x: auto;
  padding: 4rpx 0;
}

.latex-container :deep(.katex) {
  font-size: 1.1em;
  line-height: 1.2;
}

.latex-container :deep(.katex-display) {
  margin: 0.5em 0;
}
</style> 