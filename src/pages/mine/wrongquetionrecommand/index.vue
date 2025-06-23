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
      <view class="right-section"></view>
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

      <!-- 题目列表 -->
      <view v-else class="questions-list">
        <view class="list-header">
          <text class="total-count">为您找到 {{ similarQuestions.length }} 道相似题目</text>
        </view>

        <view 
          class="question-card" 
          v-for="(question, index) in similarQuestions" 
          :key="question.questionId"
          @click="toggleQuestionDetail(index)"
        >
          <!-- 题目头部信息 -->
          <view class="card-header">
            <view class="question-meta">
              <view class="question-type">
                <text class="type-tag" :class="getQuestionTypeClass(question.questionType)">
                  {{ getQuestionTypeName(question.questionType) }}
                </text>
                <text class="score-text">{{ question.score ? question.score + '分' : '暂无分数' }}</text>
              </view>
              <view class="similarity-info">
                <text class="similarity-label">相似度</text>
                <view class="similarity-bar">
                  <view class="similarity-fill" :style="{ width: (question.similarity * 100) + '%' }"></view>
                </view>
                <text class="similarity-percent">{{ Math.round(question.similarity * 100) }}%</text>
              </view>
            </view>
            <view class="expand-icon" :class="{ 'expanded': expandedQuestions.has(index) }">
              <uni-icons type="down" size="20" color="#999"></uni-icons>
            </view>
          </view>

          <!-- 题目标题 -->
          <view class="question-title">
            <template v-for="(segment, segIndex) in question.titleSegments" :key="segIndex">
              <text v-if="segment.type === 'text'" v-html="segment.content"></text>
              <MathJax v-else-if="segment.type === 'formula'" :formula="segment.content" :displayMode="segment.displayMode" />
              <image v-else-if="segment.type === 'image'" :src="segment.url" mode="widthFix" class="title-image" @click.stop="previewImage(segment.url)" />
            </template>
          </view>

          <!-- 展开的详细内容 -->
          <view v-if="expandedQuestions.has(index)" class="question-detail">
            <!-- 选择题选项 -->
            <view v-if="question.questionType === 'choice' && hasOptions(question)" class="options-section">
              <text class="section-label">选项:</text>
              <view class="options-list">
                <view 
                  class="option-item"
                  v-for="option in getQuestionOptions(question)"
                  :key="option.label"
                  :class="{ 'correct-option': isCorrectOption(option.label, question.answer) }"
                >
                  <text class="option-label">{{ option.label }}</text>
                  <view class="option-content">
                    <template v-for="(segment, segIndex) in option.segments" :key="segIndex">
                      <text v-if="segment.type === 'text'" v-html="segment.content"></text>
                      <MathJax v-else-if="segment.type === 'formula'" :formula="segment.content" :displayMode="segment.displayMode" />
                      <image v-else-if="segment.type === 'image'" :src="segment.url" mode="widthFix" class="option-image" @click.stop="previewImage(segment.url)" />
                    </template>
                  </view>
                </view>
              </view>
            </view>

            <!-- 答案 -->
            <view class="answer-section">
              <text class="section-label">答案:</text>
              <text class="answer-text" :class="getAnswerClass(question.questionType)">
                <!-- {{ question.answer }} -->
                  <MathJax :formula="question.answer" :displayMode="question.displayMode" />
            </text>
            </view>

            <!-- 解析 -->
            <view v-if="question.analysis" class="analysis-section">
              <text class="section-label">解析:</text>
              <view class="analysis-content">
                <template v-for="(segment, segIndex) in question.analysisSegments" :key="segIndex">
                  <text v-if="segment.type === 'text'" v-html="segment.content"></text>
                  <MathJax v-else-if="segment.type === 'formula'" :formula="segment.content" :displayMode="segment.displayMode" />
                  <image v-else-if="segment.type === 'image'" :src="segment.url" mode="widthFix" class="analysis-image" @click.stop="previewImage(segment.url)" />
                </template>
              </view>
            </view>

            <!-- 知识点 -->
            <view v-if="question.knowledgePoints && question.knowledgePoints.length > 0" class="knowledge-section">
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
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getWrongQuestionRecommend } from '@/api/wrongquestion';
import { getImageFromMinio } from '@/api/exam';
import { parseMathText } from '@/stores/exam';
import MathJax from '@/components/MathJax.vue';

const loading = ref(true);
const similarQuestions = ref([]);
const expandedQuestions = ref(new Set());
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

const toggleQuestionDetail = (index) => {
  if (expandedQuestions.value.has(index)) {
    expandedQuestions.value.delete(index);
  } else {
    expandedQuestions.value.add(index);
  }
  expandedQuestions.value = new Set(expandedQuestions.value);
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
  // 处理题目标题
  question.titleSegments = await parseMathText(question.title || '', imageUrlMap);
  
  // 处理选项
  const optionLabels = ['A', 'B', 'C', 'D'];
  for (const label of optionLabels) {
    const optionContent = question[`option${label}`];
    if (optionContent) {
      question[`option${label}Segments`] = await parseMathText(optionContent, imageUrlMap);
    }
  }
  
  // 处理解析
  if (question.analysis) {
    question.analysisSegments = await parseMathText(question.analysis, imageUrlMap);
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
  width: 60rpx;
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
  padding: 0 20rpx 40rpx;
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

.questions-list {
  padding-top: 20rpx;
}

.list-header {
  margin-bottom: 30rpx;
  text-align: center;
}

.total-count {
  font-size: 28rpx;
  color: #666;
  background: rgba(255, 255, 255, 0.8);
  padding: 10rpx 20rpx;
  border-radius: 20rpx;
}

.question-card {
  background: #fff;
  margin-bottom: 20rpx;
  border-radius: 16rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.question-card:active {
  transform: scale(0.98);
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

.expand-icon {
  transition: transform 0.3s ease;
}

.expand-icon.expanded {
  transform: rotate(180deg);
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

.question-detail {
  border-top: 1rpx solid #f0f0f0;
  padding-top: 20rpx;
}

.section-label {
  font-size: 28rpx;
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
  background: #f9f9f9;
  transition: all 0.3s ease;
}

.option-item.correct-option {
  background: linear-gradient(135deg, #e8f5e8 0%, #f0fff0 100%);
  border: 1rpx solid #4caf50;
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

.correct-option .option-label {
  background: #4caf50;
  border-color: #4caf50;
  color: #fff;
}

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

.answer-text {
  font-size: 30rpx;
  font-weight: 500;
}

.choice-answer {
  color: #4caf50;
  background: #e8f5e8;
  padding: 10rpx 20rpx;
  border-radius: 20rpx;
}

.text-answer {
  color: #333;
  background: #f5f5f5;
  padding: 15rpx 20rpx;
  border-radius: 8rpx;
  word-break: break-word;
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
  gap: 10rpx;
}

.knowledge-tag {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
}

.mathjax-container {
  display: inline-block;
  vertical-align: middle;
  font-size: 28rpx;
}
</style>
