<template>
  <view class="exam-preview-container" :style="{ paddingTop: containerPaddingTop }">
    <!-- 自定义头部 -->
    <view class="header-bar" :style="{ height: headerHeight, paddingTop: statusBarHeight + 'px' }">
      <view class="left-section">
        <view class="back-button" @click="goBack">
          <uni-icons type="left" size="24" color="#333"></uni-icons>
        </view>
      </view>
      <view class="center-section">
        <text class="header-title">整卷预览</text>
      </view>
      <view class="right-section"></view>
    </view>

    <!-- 试卷内容区域 -->
    <scroll-view scroll-y class="paper-content-scroll">
      <!-- 选择题部分 -->
      <view class="paper-section" v-if="paperData.choiceQuestions.length > 0">
        <view class="section-title">一、选择题：本大题共{{ paperData.choiceQuestions.length }}小题，共计{{ choiceTotalScore }}分。</view>
        <view class="question-list">
          <view class="question-item" v-for="question in paperData.choiceQuestions" :key="question.qcId">
            <text class="question-number">{{ question.queSort }}.</text>
            <view class="question-body">
              <view class="question-stem-content">
                <template v-for="(segment, index) in question.stemSegments" :key="'stem-' + question.qcId + '-' + index">
                  <view v-if="segment.type === 'text'" class="question-text-segment" v-html="segment.content"></view>
                  <MathJax v-else-if="segment.type === 'formula'" :formula="segment.content" :displayMode="segment.displayMode"></MathJax>
                  <image v-else-if="segment.type === 'image'" :src="segment.url" mode="widthFix" class="question-content-image"></image>
                </template>
              </view>
              <view class="options-grid">
                <view class="option-item" v-for="(option, optionIndex) in question.processedOptions" :key="'option-' + question.qcId + '-' + optionIndex">
                  <text class="option-label">{{ option.label }}:</text>
                  <view class="option-text-content">
                    <template v-for="(segment, segmentIndex) in option.segments" :key="'option-segment-' + question.qcId + '-' + optionIndex + '-' + segmentIndex">
                      <view v-if="segment.type === 'text'" class="option-text-segment" v-html="segment.content"></view>
                      <MathJax v-else-if="segment.type === 'formula'" :formula="segment.content" :displayMode="segment.displayMode"></MathJax>
                      <image v-else-if="segment.type === 'image'" :src="segment.url" mode="widthFix" class="option-content-image"></image>
                    </template>
                  </view>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 填空题部分 -->
      <view class="paper-section" v-if="paperData.blankQuestions.length > 0">
        <view class="section-title">二、填空题：本大题共{{ paperData.blankQuestions.length }}小题，共计{{ blankTotalScore }}分。</view>
        <view class="question-list">
          <view class="question-item" v-for="question in paperData.blankQuestions" :key="question.qbId">
            <text class="question-number">{{ question.queSort }}.</text>
            <view class="question-body">
              <view class="question-stem-content">
                <template v-for="(segment, index) in question.stemSegments" :key="'stem-' + question.qbId + '-' + index">
                  <view v-if="segment.type === 'text'" class="question-text-segment" v-html="segment.content"></view>
                  <MathJax v-else-if="segment.type === 'formula'" :formula="segment.content" :displayMode="segment.displayMode"></MathJax>
                  <image v-else-if="segment.type === 'image'" :src="segment.url" mode="widthFix" class="question-content-image"></image>
                </template>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 解答题部分 -->
      <view class="paper-section" v-if="paperData.applicationQuestions.length > 0">
        <view class="section-title">三、解答题：本大题共{{ paperData.applicationQuestions.length }}小题，共计{{ applicationTotalScore }}分。</view>
        <view class="question-list">
          <view class="question-item" v-for="question in paperData.applicationQuestions" :key="question.qaId">
            <text class="question-number">{{ question.queSort }}.</text>
            <view class="question-body">
              <text class="question-score-note">({{ question.score }}分)</text>
              <view class="question-stem-content">
                <template v-for="(segment, index) in question.stemSegments" :key="'stem-' + question.qaId + '-' + index">
                  <view v-if="segment.type === 'text'" class="question-text-segment" v-html="segment.content"></view>
                  <MathJax v-else-if="segment.type === 'formula'" :formula="segment.content" :displayMode="segment.displayMode"></MathJax>
                  <image v-else-if="segment.type === 'image'" :src="segment.url" mode="widthFix" class="question-content-image"></image>
                </template>
              </view>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getQuestionList, getImagePreSignedUrls } from '@/api/exam';
import MathJax from '@/components/MathJax.vue';
import { parseMathTextWithBatchAPI } from '@/stores/exam';
import { processImagesWithBatchAPI } from '@/utils/imageUtils';

// 获取胶囊按钮位置信息和状态栏高度 (从answering页面复制)
const menuButtonHeight = ref(0);
const menuButtonTop = ref(0);
// #ifdef MP-WEIXIN
const systemInfo = wx.getWindowInfo();
const statusBarHeight = systemInfo.statusBarHeight;
// #endif
// #ifdef H5
const statusBarHeight = 0;
// #endif

// 计算头部总高度 (从answering页面复制)
const headerHeight = computed(() => {
  // #ifdef MP-WEIXIN
  return menuButtonTop.value + menuButtonHeight.value + 'px';
  // #endif
  // #ifdef H5
  return (statusBarHeight + 44) + 'px';
  // #endif
  return '0px';
});

// 计算内容区域的顶部内边距 (从answering页面复制)
const containerPaddingTop = computed(() => {
   // #ifdef MP-WEIXIN
  return menuButtonTop.value + menuButtonHeight.value + 'px';
  // #endif
  // #ifdef H5
  return (statusBarHeight + 44) + 'px';
  // #endif
  return '0px';
});

// 返回上一页
const goBack = () => {
  // 尝试获取当前页面路由信息
  const pages = getCurrentPages();
  
  // 如果页面栈长度为1，表示当前页面是唯一页面（可能是刷新导致）
  // 此时需要重新跳转到 intro 页面而不是用 navigateBack
  if (pages.length <= 1) {
    // 从当前 URL 获取参数
    const currentPage = pages[0];
    const pageSourceId = currentPage.options?.sourceId;
    
    // 构造返回到 intro 页面的 URL
    let url = `/pages/exam/intro/index?sourceId=${pageSourceId}`;
    
    // 重新导航到 intro 页面
    uni.redirectTo({
      url: url,
      fail: () => {
        // 如果重定向失败，尝试使用 navigateTo
        uni.navigateTo({ url: url });
      }
    });
  } else {
    // 正常场景，直接返回上一页
  uni.navigateBack();
  }
};

onMounted(() => {
  // 获取胶囊按钮位置信息 (从answering页面复制)
  // #ifdef MP-WEIXIN
  const menuButtonInfo = wx.getMenuButtonBoundingClientRect();
  menuButtonHeight.value = menuButtonInfo.height;
  menuButtonTop.value = menuButtonInfo.top;
  // #endif
});

// 试卷数据
const paperData = ref({
  choiceQuestions: [],
  blankQuestions: [],
  applicationQuestions: [],
  imageUrlMap: {}
});

// 计算选择题总分
const choiceTotalScore = computed(() => {
  return paperData.value.choiceQuestions.reduce((sum, q) => sum + q.score, 0);
});

// 计算填空题总分
const blankTotalScore = computed(() => {
  return paperData.value.blankQuestions.reduce((sum, q) => sum + q.score, 0);
});

// 计算解答题总分
const applicationTotalScore = computed(() => {
  return paperData.value.applicationQuestions.reduce((sum, q) => sum + q.score, 0);
});

// 获取试卷详情
const fetchPaperDetail = async (sourceId) => {
  try {
    const res = await getQuestionList(sourceId);
    if (res.flag === '1' && res.result) {
      const imageUrlMap = res.result.imageUrlMap || {};
      
      // 收集所有图片路径
      const allImagePaths = new Set();
      for (const imageId in imageUrlMap) {
        if (imageUrlMap[imageId]) {
          // 处理图片路径，确保格式正确
          const path = imageUrlMap[imageId].startsWith('http') ? 
            new URL(imageUrlMap[imageId]).pathname : 
            imageUrlMap[imageId];
          allImagePaths.add(path);
        }
      }
      
      // 批量获取图片预签名URL
      let imagePreSignedUrlMap = {};
      if (allImagePaths.size > 0) {
        try {
          imagePreSignedUrlMap = await processImagesWithBatchAPI([...allImagePaths]);
          console.log('批量获取图片预签名URL成功，数量:', Object.keys(imagePreSignedUrlMap).length);
        } catch (e) {
          console.error('批量获取图片预签名URL失败', e);
        }
      }

      // Process choice questions
      const processedChoiceQuestions = await Promise.all(res.result.choiceQuestions.map(async q => {
        const stemSegments = await parseMathTextWithBatchAPI(q.queStem, imageUrlMap, imagePreSignedUrlMap);
        const processedOptions = await Promise.all([
          { label: 'A', segments: await parseMathTextWithBatchAPI(q.optionA, imageUrlMap, imagePreSignedUrlMap) },
          { label: 'B', segments: await parseMathTextWithBatchAPI(q.optionB, imageUrlMap, imagePreSignedUrlMap) },
          { label: 'C', segments: await parseMathTextWithBatchAPI(q.optionC, imageUrlMap, imagePreSignedUrlMap) },
          { label: 'D', segments: await parseMathTextWithBatchAPI(q.optionD, imageUrlMap, imagePreSignedUrlMap) },
        ].filter(opt => opt.segments.length > 0)); // Filter out empty options

        return {
          ...q,
          stemSegments,
          processedOptions
        };
      }));

      // Process blank questions
      const processedBlankQuestions = await Promise.all(res.result.blankQuestions.map(async q => {
        const stemSegments = await parseMathTextWithBatchAPI(q.queStem, imageUrlMap, imagePreSignedUrlMap);
        return {
          ...q,
          stemSegments
        };
      }));

      // Process application questions
      const processedApplicationQuestions = await Promise.all(res.result.applicationQuestions.map(async q => {
        const stemSegments = await parseMathTextWithBatchAPI(q.queStem, imageUrlMap, imagePreSignedUrlMap);
        return {
          ...q,
          stemSegments
        };
      }));

      paperData.value = {
        ...res.result,
        choiceQuestions: processedChoiceQuestions,
        blankQuestions: processedBlankQuestions,
        applicationQuestions: processedApplicationQuestions
      };
    } else {
      uni.showToast({
        title: '获取试卷详情失败',
        icon: 'none'
      });
    }
  } catch (error) {
    console.error('获取试卷详情失败:', error);
    uni.showToast({
      title: '获取试卷详情失败',
      icon: 'none'
    });
  }
};

onLoad((options) => {
  console.log('preview: Page onLoad', options);
  if (options && options.sourceId) {
    const sourceId = options.sourceId;
    console.log('preview: Received sourceId from options:', sourceId);
    fetchPaperDetail(sourceId);
  } else {
    console.warn('preview: No sourceId received from options.');
  }
});
</script>

<style lang="scss" scoped>
.exam-preview-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8f8ff 0%, #e0e7ff 100%);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

/* 自定义头部 */
.header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20rpx;
  width: 100%;
  box-sizing: border-box;
  background: linear-gradient(135deg, #f8f8ff 0%, #e0e7ff 100%);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
}

.left-section {
    display: flex;
    align-items: center;
    height: 100%;
}

.center-section {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.header-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}

.right-section {
    display: flex;
    align-items: center;
    height: 100%;
    width: 60rpx; /* 与左侧返回按钮对齐 */
}

.back-button {
  width: 60rpx;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  height: 100%;
}

.paper-content-scroll {
  flex: 1;
  width: 100%;
  padding: 20rpx;
  box-sizing: border-box;
}

.paper-section {
  background-color: #fff;
  border-radius: 12rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);

  &:last-child {
    margin-bottom: 0;
  }
}

.section-title {
  font-size: 34rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
  border-bottom: 1rpx solid #eee;
  padding-bottom: 10rpx;
}

.question-list {
  /* margin-top: 20rpx; */
}

.question-item {
  display: flex;
  margin-bottom: 30rpx;

  &:last-child {
    margin-bottom: 0;
  }
}

.question-number {
  font-size: 32rpx;
  font-weight: bold;
  color: #555;
  margin-right: 15rpx;
}

.question-body {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.question-stem-content {
  font-size: 0;
  line-height: 1.6;
  word-break: break-all;
  display: inline;
}

.question-text-segment {
  display: inline-block;
  vertical-align: middle;
  font-size: 32rpx;
  color: #333;
  line-height: 1.6;
  word-break: break-all;
}

.options-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx 40rpx;
  margin-top: 20rpx;
}

.option-item {
  display: flex;
  align-items: flex-start;
  flex: 0 0 calc(50% - 20rpx);
  line-height: 1.5;
  word-break: break-all;
}

.option-label {
  font-size: 30rpx;
  color: #007aff;
  margin-right: 10rpx;
  flex-shrink: 0;
}

.question-score-note {
  font-size: 28rpx;
  color: #888;
  margin-bottom: 10rpx;
  text-align: right;
}

.sub-question {
  font-size: 30rpx;
  color: #333;
  margin-bottom: 10rpx;
  line-height: 1.6;
}

.question-content-image,
.option-content-image {
  max-width: 60%;
  height: auto;
  display: block;
  margin: 10rpx auto;
  border-radius: 8rpx;
}

.mathjax-container {
  display: inline-block;
  vertical-align: middle;
  font-size: 32rpx;

  & mjx-container[jax="CHTML"][display="true"] {
    display: block;
    margin: 1em 0;
  }
  & mjx-container[jax="SVG"][display="true"] {
    display: block;
    margin: 1em 0;
  }
}
</style> 