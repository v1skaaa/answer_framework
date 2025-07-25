<template>
  <view class="recommend-container">
    <!-- 头部 -->
    <view class="header-bar" :style="{ height: headerHeight, paddingTop: statusBarHeight + 'px' }">
      <view class="left-section">
        <view class="back-button" @click="goBack">
          <uni-icons type="left" size="24" color="#333"></uni-icons>
        </view>
      </view>
      <view class="center-section">
        <text class="header-title">相似题目推荐</text>
      </view>
    </view>

    <view class="content-wrapper" :style="{ paddingTop: headerHeight }">
      <!-- 加载状态 -->
      <view v-if="loading" class="loading-state">
        <uni-icons type="spinner-cycle" size="40" color="#007aff" class="loading-icon"></uni-icons>
        <text class="loading-text">正在加载相似题目...</text>
      </view>

      <!-- 空状态 -->
      <view v-else-if="!loading && similarQuestions.length === 0" class="empty-state">
        <image src="/static/images/empty.png" mode="widthFix" class="empty-image" />
        <text class="empty-text">暂无相似题目</text>
      </view>

      <!-- 题目内容容器 - 使用swiper支持滑动 -->
      <view v-else class="questions-container">
        <swiper 
          class="questions-swiper"
          :current="currentIndex"
          @change="onSwiperChange"
          :duration="300"
        >
          <swiper-item 
            v-for="(question, qIndex) in similarQuestions" 
            :key="qIndex"
            class="swiper-item"
          >
            <scroll-view 
              class="question-scroll"
              scroll-y="true"
              :enhanced="true"
              :show-scrollbar="false"
            >
              <view class="question-page">
                <!-- 题目信息卡片 -->
                <view class="question-card">
                  <!-- 题目头部信息 -->
                  <view class="card-header">
                    <view class="question-meta">
                      <view class="question-type">
                        <view>
                            <text class="type-tag" :class="getQuestionTypeClass(question.questionType)">
                            {{ getQuestionTypeName(question.questionType) }}
                            {{ question.choiceType === 2 ? '(多选)' : '' }}
                            </text>
                            <text class="score-text">{{ question.score ? question.score + '分' : '暂无分数' }}</text>
                        </view>
                        <view class="right-section">
                            <view class="question-counter" v-if="!loading && similarQuestions.length > 0">
                            <text>{{ currentIndex + 1 }}/{{ similarQuestions.length }}</text>
                            </view>
                        </view>
                      </view>
                      <!-- <view class="similarity-info">
                        <text class="similarity-label">相似度</text>
                        <view class="similarity-bar">
                          <view class="similarity-fill" :style="{ width: (question.similarity * 100) + '%' }"></view>
                        </view>
                        <text class="similarity-percent">{{ Math.round(question.similarity * 100) }}%</text>
                      </view> -->
                    </view>
                  </view>

                  <!-- 题目标题 -->
                  <view class="question-title">
                    <template v-for="(segment, segIndex) in question.titleSegments" :key="segIndex">
                      <text v-if="segment.type === 'text'" v-html="segment.content"></text>
                      <MathJax v-else-if="segment.type === 'formula'" :formula="segment.content" :displayMode="segment.displayMode" />
                      <image v-else-if="segment.type === 'image'" :src="segment.url" mode="widthFix" class="title-image" @click="previewImage(segment.url)" />
                    </template>
                  </view>

                  <!-- 选择题选项 -->
                  <view v-if="question.questionType === 'choice' && hasOptions(question)" class="options-section">
                    <view class="options-list">
                      <view 
                        class="option-item"
                        v-for="option in getQuestionOptions(question)"
                        :key="option.label"
                      >
                        <view class="option-label" :class="{ 'multi-choice': question.choiceType === 2 }">
                          {{ option.label }}
                        </view>
                        <view class="option-content">
                          <template v-for="(segment, segIndex) in option.segments" :key="segIndex">
                            <text v-if="segment.type === 'text'" v-html="segment.content"></text>
                            <MathJax v-else-if="segment.type === 'formula'" :formula="segment.content" :displayMode="segment.displayMode" />
                            <image v-else-if="segment.type === 'image'" :src="segment.url" mode="widthFix" class="option-image" @click="previewImage(segment.url)" />
                          </template>
                        </view>
                      </view>
                    </view>
                  </view>

                  <!-- 查看答案按钮 -->
                  <view class="answer-button-container">
                    <button 
                      class="answer-button" 
                      :class="{ 'answered': showAnswers[qIndex] }"
                      @click="toggleAnswer(qIndex)"
                    >
                      {{ showAnswers[qIndex] ? '隐藏答案' : '查看正确答案' }}
                    </button>
                  </view>

                  <!-- 答案详情 -->
                  <view v-if="showAnswers[qIndex]" class="answer-detail">
                    <!-- 答案 -->
                    <view class="answer-section">
                      <text class="section-label">正确答案:</text>
                      <view class="answer-content">
                        <view class="answer-text" :class="getAnswerClass(question.questionType)">
                          <template v-if="question.questionType === 'choice'">
                            {{ question.answer }}
                          </template>
                          <template v-else>
                            <MathJax :formula="question.answer" :displayMode="question.displayMode" />
                          </template>
                        </view>
                      </view>
                    </view>

                    <!-- 解析 -->
                    <view v-if="question.analysis" class="analysis-section">
                      <text class="section-label">解析:</text>
                      <view class="analysis-content">
                        <template v-for="(segment, segIndex) in question.analysisSegments" :key="segIndex">
                          <text v-if="segment.type === 'text'" v-html="segment.content"></text>
                          <MathJax v-else-if="segment.type === 'formula'" :formula="segment.content" :displayMode="segment.displayMode" />
                          <image v-else-if="segment.type === 'image'" :src="segment.url" mode="widthFix" class="analysis-image" @click="previewImage(segment.url)" />
                        </template>
                      </view>
                    </view>

                    <!-- 知识点 -->
                    <!-- <view v-if="question.knowledgePoints && question.knowledgePoints.length > 0" class="knowledge-section">
                      <text class="section-label">相关知识点:</text>
                      <view class="knowledge-tags">
                        <text 
                          class="knowledge-tag" 
                          v-for="(point, kIndex) in question.knowledgePoints" 
                          :key="kIndex"
                        >
                          {{ point }}
                        </text>
                      </view>
                    </view> -->
                  </view>
                </view>
                
                <!-- 底部安全区域，避免被导航按钮遮挡 -->
                <view class="bottom-safe-area"></view>
              </view>
            </scroll-view>
          </swiper-item>
        </swiper>

        <!-- 导航按钮 -->
        <view class="navigation-buttons" v-if="similarQuestions.length > 1">
          <view class="dual-button-container">
            <button class="nav-button prev-button" @click="handlePrevQuestion" :disabled="currentIndex === 0">
              上一题
            </button>
            <button class="nav-button next-button" @click="handleNextQuestion" :disabled="currentIndex === similarQuestions.length - 1">
              下一题
            </button>
          </view>
        </view>

        <!-- 滑动提示指示器 -->
        <!-- <view class="swipe-indicator" v-if="similarQuestions.length > 1">
          <view 
            class="indicator-dot" 
            v-for="(item, index) in similarQuestions" 
            :key="index"
            :class="{ 'active': index === currentIndex }"
          ></view>
        </view> -->
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getWrongQuestionRecommend } from '@/api/wrongquestion';
import { getImageFromMinio, getImagePreSignedUrls } from '@/api/exam';
import { parseMathText, parseMathTextWithBatchAPI } from '@/stores/exam';
import { processImagesWithBatchAPI } from '@/utils/imageUtils';
import MathJax from '@/components/MathJax.vue';

const loading = ref(true);
const similarQuestions = ref([]);
const showAnswers = ref([]);
const currentIndex = ref(0);
const qaId = ref('');

// 头部高度相关
const statusBarHeight = ref(0);
const menuButtonHeight = ref(0);
const menuButtonTop = ref(0);

// #ifdef MP-WEIXIN
const systemInfo = uni.getSystemInfoSync();
statusBarHeight.value = systemInfo.statusBarHeight;
const menuButtonInfo = uni.getMenuButtonBoundingClientRect();
menuButtonHeight.value = menuButtonInfo.height;
menuButtonTop.value = menuButtonInfo.top;
// #endif

// #ifdef H5
statusBarHeight.value = 0;
const h5HeaderHeight = 44;
menuButtonTop.value = 0;
menuButtonHeight.value = h5HeaderHeight;
// #endif

const headerHeight = computed(() => {
  // #ifdef MP-WEIXIN
  return menuButtonTop.value + menuButtonHeight.value + 'px';
  // #endif
  // #ifdef H5
  return (statusBarHeight.value + h5HeaderHeight) + 'px';
  // #endif
  return '64px';
});

const goBack = () => {
  uni.navigateBack();
};

// Swiper滑动事件处理
const onSwiperChange = (e) => {
  const { current } = e.detail;
  currentIndex.value = current;
};

// 切换答案显示状态
const toggleAnswer = (index) => {
  showAnswers.value[index] = !showAnswers.value[index];
};

// 导航按钮处理函数
const handlePrevQuestion = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--;
  }
};

const handleNextQuestion = () => {
  if (currentIndex.value < similarQuestions.value.length - 1) {
    currentIndex.value++;
  }
};

// 切换到指定题目
const switchToQuestion = (index) => {
  currentIndex.value = index;
};

const getQuestionTypeName = (type) => {
  const typeMap = {
    'choice': '选择题',
    'blank': '填空题',
    'application': '解答题'
  };
  return typeMap[type] || '未知题型';
};

const getQuestionTypeClass = (type) => {
  const classMap = {
    'choice': 'type-choice',
    'blank': 'type-blank',
    'application': 'type-application'
  };
  return classMap[type] || '';
};

const getAnswerClass = (type) => {
  return type === 'choice' ? 'choice-answer' : 'text-answer';
};

const hasOptions = (question) => {
  return question.optionA || question.optionB || question.optionC || question.optionD;
};

const getQuestionOptions = (question) => {
  const options = [];
  const optionLabels = ['A', 'B', 'C', 'D'];
  
  for (const label of optionLabels) {
    const optionContent = question[`option${label}`];
    if (optionContent) {
      options.push({
        label,
        segments: question[`option${label}Segments`] || [{ type: 'text', content: optionContent }]
      });
    }
  }
  
  return options;
};

// 判断选项是否为正确答案（支持单选和多选）
const isCorrectOption = (optionLabel, answer) => {
  if (!answer) return false;
  // 如果答案包含该选项标签，则认为是正确选项
  return answer.toString().includes(optionLabel);
};

const previewImage = (url) => {
  // 收集当前页面所有图片
  const urls = [];
  similarQuestions.value.forEach(question => {
    // 题目标题图片
    if (question.titleSegments) {
      question.titleSegments.forEach(seg => {
        if (seg.type === 'image' && seg.url) urls.push(seg.url);
      });
    }
    // 选项图片
    const options = getQuestionOptions(question);
    options.forEach(opt => {
      if (opt.segments) {
        opt.segments.forEach(seg => {
          if (seg.type === 'image' && seg.url) urls.push(seg.url);
        });
      }
    });
    // 解析图片
    if (question.analysisSegments) {
      question.analysisSegments.forEach(seg => {
        if (seg.type === 'image' && seg.url) urls.push(seg.url);
      });
    }
  });
  
  if (urls.length === 0) return;
  uni.previewImage({
    urls,
    current: url
  });
};

// 处理图片URL映射和数学公式解析
const processQuestionContent = async (question, imageUrlMap) => {
  // 添加调试日志
  console.log('Processing question fields:', {
    hasTitle: !!question.title,
    hasQueStem: !!question.queStem,
    questionType: question.questionType,
    hasOptions: question.optionA || question.optionB || question.optionC || question.optionD,
  });
  
  // 收集所有图片路径
  const allImagePaths = new Set();
  for (const imageId in imageUrlMap) {
    if (imageUrlMap[imageId]) {
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
  
  // 题干解析
  if (question.title) {
    question.titleSegments = await parseMathTextWithBatchAPI(question.title, imageUrlMap, imagePreSignedUrlMap);
  } else if (question.queStem) {
    question.titleSegments = await parseMathTextWithBatchAPI(question.queStem, imageUrlMap, imagePreSignedUrlMap);
  } else {
    question.titleSegments = [];
  }
  
  // 选项解析 (选择题)
  for (const opt of ['A', 'B', 'C', 'D']) {
    if (question[`option${opt}`]) {
      question[`option${opt}Segments`] = await parseMathTextWithBatchAPI(question[`option${opt}`], imageUrlMap, imagePreSignedUrlMap);
    }
  }
  
  // 解析处理
  if (question.analysis) {
    question.analysisSegments = await parseMathTextWithBatchAPI(question.analysis, imageUrlMap, imagePreSignedUrlMap);
  } else {
    question.analysisSegments = [];
  }
  
  return question;
};

// 获取相似题目数据
const loadSimilarQuestions = async () => {
  if (!qaId.value) {
    uni.showToast({
      title: '题目ID不能为空',
      icon: 'none'
    });
    loading.value = false;
    return;
  }

  try {
    loading.value = true;
    const res = await getWrongQuestionRecommend(qaId.value);
    
    // 添加调试日志
    console.log('API Response:', res);
    if (res.result && res.result.similarQuestions) {
      console.log('First question:', res.result.similarQuestions[0]);
    }
    
    if (res.flag === '1' && res.result) {
      const { similarQuestions: questions, imageUrlMap } = res.result;
      
      // 处理每个题目的内容
      const processedQuestions = [];
      for (const question of questions || []) {
        const processedQuestion = await processQuestionContent(question, imageUrlMap || {});
        
        // 解析知识点
        if (processedQuestion.knowledgePointIds) {
          try {
            const knowledgeIds = JSON.parse(processedQuestion.knowledgePointIds);
            processedQuestion.knowledgePoints = knowledgeIds.map(id => `知识点-${id}`);
          } catch (e) {
            processedQuestion.knowledgePoints = [];
          }
        }
        
        processedQuestions.push(processedQuestion);
      }
      
      similarQuestions.value = processedQuestions;
      // 初始化答案显示状态数组
      showAnswers.value = new Array(processedQuestions.length).fill(false);
    } else {
      uni.showToast({
        title: res.msg || '获取相似题目失败',
        icon: 'none'
      });
    }
  } catch (error) {
    console.error('获取相似题目失败:', error);
    uni.showToast({
      title: '网络错误，请稍后重试',
      icon: 'none'
    });
  } finally {
    loading.value = false;
  }
};

onLoad(async (options) => {
  qaId.value = options.qaId;
  if (qaId.value) {
    await loadSimilarQuestions();
  } else {
    loading.value = false;
  }
});
</script>

<style lang="scss" scoped>
.recommend-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8f8ff 0%, #e0e7ff 100%);
}

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
  min-width: 60rpx;
}

.question-counter {
  background: rgba(255, 255, 255, 0.9);
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
  color: #333;
}

.back-button {
  width: 60rpx;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  height: 100%;
}

.content-wrapper {
  min-height: 100vh;
  box-sizing: border-box;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60vh;
  color: #666;
}

.loading-icon {
  margin-bottom: 20rpx;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.loading-text {
  font-size: 28rpx;
  color: #666;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60vh;
  color: #999;
}

.empty-image {
  width: 200rpx;
  height: 200rpx;
  margin-bottom: 30rpx;
}

.empty-text {
  font-size: 30rpx;
  color: #999;
}

.questions-container {
  height: calc(100vh - var(--header-height, 100rpx));
  position: relative;
}

.questions-swiper {
  height: 100%;
  width: 100%;
}

.swiper-item {
  height: 100%;
  width: 100%;
}

.question-scroll {
  height: 100%;
  width: 100%;
}

.question-page {
  padding: 20rpx;
  min-height: 100%;
  box-sizing: border-box;
}

.question-card {
  border-radius: 16rpx;
  display: flex;
  flex-direction: column;
}

.bottom-safe-area {
  height: 200rpx;
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20rpx;
}

.question-meta {
  flex: 1;
}

.question-type {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  margin-bottom: 15rpx;
}

.type-tag {
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
  font-weight: 500;
  color: #fff;
}

.type-choice {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.type-blank {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.type-application {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.score-text {
  font-size: 24rpx;
  color: #666;
  background: #f5f5f5;
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
  margin-left: 8px;
}

.similarity-info {
  display: flex;
  align-items: center;
  gap: 15rpx;
}

.similarity-label {
  font-size: 24rpx;
  color: #666;
}

.similarity-bar {
  width: 120rpx;
  height: 12rpx;
  background: #f0f0f0;
  border-radius: 6rpx;
  position: relative;
  overflow: hidden;
}

.similarity-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff6b6b 0%, #ffa500 50%, #4ecdc4 100%);
  border-radius: 6rpx;
  transition: width 0.3s ease;
}

.similarity-percent {
  font-size: 24rpx;
  color: #007aff;
  font-weight: 500;
}

.answer-button-container {
  margin: 30rpx 0;
  text-align: center;
}

.answer-button {
  background: linear-gradient(135deg, #007aff 0%, #5ac8fa 100%);
  color: #fff;
  border: none;
  padding: 10rpx 20rpx;
  border-radius: 30rpx;
  font-size: 30rpx;
  font-weight: 500;
  width: 80%;
  transition: all 0.3s ease;
  box-shadow: 0 4rpx 15rpx rgba(0, 122, 255, 0.3);
}

.answer-button.answered {
  background: linear-gradient(135deg, #ff6b6b 0%, #ffa500 100%);
  box-shadow: 0 4rpx 15rpx rgba(255, 107, 107, 0.3);
}

.answer-button:active {
  transform: scale(0.98);
}

.question-title {
  font-size: 32rpx;
  color: #333;
  line-height: 1.6;
  margin-bottom: 20rpx;
  word-break: break-word;
}

.question-title text {
  vertical-align: middle;
  font-size: 32rpx;
}

.title-image,
.option-image,
.analysis-image {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 10rpx auto;
  border-radius: 8rpx;
}

.answer-detail {
  border-top: 1rpx solid #f0f0f0;
  padding-top: 20rpx;
  margin-top: 20rpx;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.section-label {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 15rpx;
}

.options-section {
  margin-bottom: 25rpx;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 15rpx;
}

.option-item {
  display: flex;
  align-items: flex-start;
  padding: 15rpx;
  border-radius: 8rpx;
//   background: #f9f9f9;
  transition: all 0.3s ease;
}

.option-label {
  font-size: 28rpx;
  color: #007aff;
  margin-right: 15rpx;
  width: 40rpx;
  height: 40rpx;
  border: 2rpx solid #007aff;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
}

// .option-label.multi-choice {
//   border-radius: 8rpx;
// }

.option-content {
  flex: 1;
  font-size: 28rpx;
  color: #333;
  line-height: 1.6;
}

.option-content text {
  vertical-align: middle;
  font-size: 28rpx;
}

.answer-section {
  margin-bottom: 25rpx;
}

.answer-content {
  margin-top: 10rpx;
}

.answer-text {
  font-size: 30rpx;
  font-weight: 500;
  color: #4caf50;
  background: linear-gradient(135deg, #e8f5e8 0%, #f0fff0 100%);
  padding: 15rpx 20rpx;
  border-radius: 12rpx;
  border: 1rpx solid #4caf50;
  display: block;
  line-height: 1.6;
  word-break: break-word;
}

.answer-text.choice-answer {
  display: inline-block;
  min-width: 60rpx;
  text-align: center;
}

.answer-text.text-answer {
  display: block;
  text-align: left;
}

.analysis-section {
  margin-bottom: 25rpx;
}

.analysis-content {
  font-size: 28rpx;
  color: #555;
  line-height: 1.6;
  word-break: break-word;
}

.analysis-content text {
  vertical-align: middle;
  font-size: 28rpx;
}

.knowledge-section {
  margin-bottom: 15rpx;
}

.knowledge-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 25rpx;
}

.knowledge-tag {
  background: #7a7aff;
  color: #fff;
  padding: 12rpx 18rpx;
  border-radius: 25rpx;
  font-size: 24rpx;
}

.mathjax-container {
  display: inline-block;
  vertical-align: middle;
  font-size: 28rpx;
}

/* 导航按钮样式 */
.navigation-buttons {
  position: fixed;
  bottom: 40rpx;
  left: 0;
  right: 0;
  padding: 0 40rpx;
  z-index: 99;
}

.dual-button-container {
  display: flex;
  justify-content: space-between;
  gap: 40rpx;
}

.nav-button {
  flex: 1;
  height: 88rpx;
  border-radius: 44rpx;
  font-size: 32rpx;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.prev-button {
  background-color: #007aff;
  color: #fff;
}

.prev-button:disabled {
  background-color: #e0e0e0;
  color: #999;
}

.next-button {
  background-color: #007aff;
  color: #fff;
}

.next-button:disabled {
  background-color: #ccc;
  color: #999;
}

.nav-button:active:not(:disabled) {
  transform: scale(0.98);
}

/* 滑动指示器样式 */
.swipe-indicator {
  position: fixed;
  bottom: 160rpx;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 12rpx;
  padding: 12rpx 24rpx;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 30rpx;
  z-index: 98;
}

.indicator-dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.4);
  transition: all 0.3s ease;
}

.indicator-dot.active {
  background: #fff;
  transform: scale(1.2);
}
</style>
