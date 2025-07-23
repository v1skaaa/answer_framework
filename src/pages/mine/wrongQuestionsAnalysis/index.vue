<template>
  <view class="wrong-analysis-container">
    <!-- 头部 -->
    <view class="header-bar" :style="{ height: headerHeight, paddingTop: statusBarHeight + 'px' }">
      <view class="left-section">
        <view class="back-button" @click="goBack">
          <uni-icons type="left" size="24" color="#333"></uni-icons>
        </view>
      </view>
      <view class="center-section">
        <text class="question-counter" style="padding-left: 70rpx;">
          <text class="current-index">{{ currentIndex + 1 }}</text> / {{ questions.length }}
        </text>
      </view>
      <view class="right-section">
        <!-- 收藏图标 -->
        <uni-icons
          :type="examStore.favoritedQuestionIds.has(currentQuestion?.qaId) ? 'star-filled' : 'star'"
          size="24"
          :color="examStore.favoritedQuestionIds.has(currentQuestion?.qaId) ? '#ffb300' : '#333'"
          class="header-icon"
          @click="examStore.toggleFavorite(currentQuestion?.qaId)"
        ></uni-icons>
        <image
          src="/static/images/datika.png"
          class="header-icon datika-icon"
          @click="toggleQuestionCard"
          mode="widthFix"
        />
      </view>
    </view>

    <view v-if="questions.length === 0" class="empty-state">
      <image src="/static/images/empty.png" mode="widthFix" class="empty-image" />
      <text class="empty-text">暂无错题</text>
    </view>
    <view v-else class="question-content-wrapper" :style="{ marginTop: headerHeight }">
      <!-- 移除原来的content-header -->
      
      <swiper
        class="questions-swiper"
        :style="{ height: swiperHeight }"
        :current="currentIndex"
        @change="onSwiperChange"
        :duration="300"
      >
        <swiper-item
          v-for="(question, qIndex) in questions"
          :key="question.idx"
          class="swiper-item"
        >
          <scroll-view class="question-scroll" scroll-y="true" style="height: 100%; width: 100%;">
            <view class="question-main">
              <view class="question-score-info">
                <text class="score-label left" v-if="currentQuestion.score !== undefined && currentQuestion.score !== null">
                  本题分值：{{ currentQuestion.score }}分
                </text>
                <text class="score-label right" v-if="currentQuestion.value !== undefined && currentQuestion.value !== null">
                  你的得分：
                  <text :style="
                    currentQuestion.value === 0
                      ? 'color: #F44336;'
                      : (currentQuestion.value === currentQuestion.score
                          ? 'color: #4CAF50;'
                          : 'color:rgb(238, 167, 44);')
                  ">
                    {{ currentQuestion.value }}
                  </text>分
                </text>
              </view>
              <view class="question-stem-content">
                <template v-for="(segment, index) in question.textSegments" :key="index">
                  <text v-if="segment.type === 'text'" v-html="segment.content"></text>
                  <MathJax v-else-if="segment.type === 'formula'" :formula="segment.content" :displayMode="segment.displayMode" />
                  <image v-else-if="segment.type === 'image'" :src="segment.url" mode="widthFix" class="question-content-image" @click="previewImage(segment.url)" />
                </template>
              </view>

              <!-- 选择题选项 -->
              <view v-if="question.type === 1 && question.options.length > 0" class="answer-area">
                <view
                  class="choice-item"
                  v-for="(option, optionIndex) in question.options"
                  :key="optionIndex"
                  :class="{'selected': isOptionSelected(option.value)}"
                >
                  <text class="option-label">{{ option.label }}</text>
                  <view class="option-text-content">
                    <template v-for="(segment, segmentIndex) in option.segments" :key="segmentIndex">
                      <text v-if="segment.type === 'text'" v-html="segment.content"></text>
                      <MathJax v-else-if="segment.type === 'formula'" :formula="segment.content" :displayMode="segment.displayMode" />
                      <image v-else-if="segment.type === 'image'" :src="segment.url" mode="widthFix" class="option-content-image" @click="previewImage(segment.url)" />
                    </template>
                  </view>
                </view>
              </view>
              <view v-else-if="question.type === 1 && question.options.length === 0" class="unsupported-tip">
                <text>本选择题暂无选项数据</text>
              </view>

              <!-- 填空题/解答题答案 -->
              <view v-if="question.type === 2 || question.type === 3" class="answer-area">
                <view class="student-answer">
                  <text class="answer-label">你的答案:</text>
                  <template v-if="question.imageUrls && question.imageUrls.length">
                    <view class="image-preview-list">
                      <view class="image-preview-item" v-for="(imageUrl, index) in question.imageUrls" :key="index">
                        <image :src="imageUrl" mode="aspectFill" class="preview-image" @click="previewImage(imageUrl)" />
                      </view>
                    </view>
                  </template>
                  <template v-else-if="question.stuAnswer">
                    <text>{{ question.stuAnswer }}</text>
                  </template>
                  <text v-else>未作答</text>
                </view>
                <!-- 教师评语（填空题/解答题专属，放在你的答案下方） -->
                <view class="teacher-comment-section" v-if="question.teacherComment">
                  <text class="comment-label">教师评语:</text>
                  <view class="comment-content-text">
                    <text>{{ question.teacherComment }}</text>
                  </view>
                </view>
              </view>

              <!-- 教师评语（选择题专属，放在正确答案上方、解析下方） -->
              <view v-if="question.type === 1 && question.teacherComment" class="teacher-comment-section">
                <text class="comment-label">教师评语:</text>
                <view class="comment-content-text">
                  <text>{{ question.teacherComment }}</text>
                </view>
              </view>

              <!-- 相似题目按钮 -->
              <view class="question-actions-row">
                <button 
                  class="answer-button" 
                  :class="{ 'answered': showAnswers[qIndex] }"
                  @click="toggleAnswer(qIndex)"
                >
                  {{ showAnswers[qIndex] ? getAnswerButtonText(question, true) : getAnswerButtonText(question, false) }}
                </button>
                <button class="similar-questions-btn" @click="goToSimilarQuestions">
                  <uni-icons type="lightbulb" size="20" color="#007aff"></uni-icons>
                  <text class="similar-btn-text">查找相似题目</text>
                </button>
              </view>

              <!-- 答案详情 -->
              <view v-show="showAnswers[qIndex]" class="answer-detail">
                <!-- 选择题正确答案 -->
                <view v-if="question.type === 1 && question.correctAnswer" class="answer-section">
                  <text class="section-label">正确答案:</text>
                  <view class="answer-content">
                    <view class="answer-text choice-answer">
                      {{ question.correctAnswer }}
                    </view>
                  </view>
                </view>

                <!-- 解析 -->
                <view class="analysis-section">
                  <text class="section-label">解析:</text>
                  <view class="analysis-content">
                    <template v-for="(segment, index) in question.analysisSegments" :key="index">
                      <text v-if="segment.type === 'text'" v-html="segment.content"></text>
                      <MathJax v-else-if="segment.type === 'formula'" :formula="segment.content" :displayMode="segment.displayMode" />
                      <image v-else-if="segment.type === 'image'" :src="segment.url" mode="widthFix" class="analysis-content-image" @click="previewImage(segment.url)" />
                    </template>
                    <text v-if="!question.analysisSegments || question.analysisSegments.length === 0">暂无解析</text>
                  </view>
                </view>
                <!-- 视频展示区域（仅在解析展开时显示） -->
                <view v-if="question.videoUrl" class="question-video-section" style="margin-top: 80rpx;">
                  <text style="color: #333; font-weight: bold; font-size: 32rpx; display: block; margin-bottom: 10rpx; font-size: 36rpx;">视频讲解：</text>
                  <video :src="question.videoUrl" controls style="width: 100%;"></video>
                </view>
              </view>

              
            </view>
          </scroll-view>
        </swiper-item>
      </swiper>
      <view class="navigation-buttons">
        <view class="dual-button-container">
          <button class="nav-button prev-button" @click="handlePrevQuestion" :disabled="currentIndex === 0">上一题</button>
          <button class="nav-button next-button" @click="handleNextQuestion" :disabled="currentIndex === questions.length - 1">下一题</button>
        </view>
      </view>
    </view>

    <!-- 答题卡 -->
    <view class="question-card-overlay" :class="{'show': showQuestionCard}" @click="toggleQuestionCard">
      <view class="question-card-content" @click.stop>
        <view class="card-header">
          <text class="card-title">答题卡</text>
          <text class="card-close-icon" @click="toggleQuestionCard">×</text>
        </view>
        <scroll-view class="card-body" scroll-y>
          <view class="question-number-list">
            <view
              class="question-number-item"
              v-for="(q, idx) in questions"
              :key="q.idx"
              :class="{'current': idx === currentIndex}"
              @click="goToQuestion(idx); toggleQuestionCard()"
            >
              {{ idx + 1 }}
            </view>
          </view>
        </scroll-view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getWrongQuestionDetails, getWrongQuestionsByKnowledgePoint, getVideoPreSignedUrls } from '@/api/exam';
import { parseMathText } from '@/stores/exam';
import { getImageFromMinio } from '@/api/exam';
import MathJax from '@/components/MathJax.vue';
import { useExamStore } from '@/stores/exam';

const examStore = useExamStore();
const questions = ref([]);
const currentIndex = ref(0);
const showQuestionCard = ref(false);
const showAnswers = ref([]);
const transitionDirection = ref('left');
const menuButtonHeight = ref(0);
const menuButtonTop = ref(0);
const statusBarHeight = ref(0);

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

const currentQuestion = computed(() => questions.value[currentIndex.value] || {});

// --- 滑动切换题目相关 ---
const touchStartX = ref(0);
const touchEndX = ref(0);
const touchStartY = ref(0);
const touchEndY = ref(0);
const touchThreshold = 50;

const handleTouchStart = (event) => {
  const touch = event.touches ? event.touches[0] : event;
  touchStartX.value = touch.clientX;
  touchStartY.value = touch.clientY;
  touchEndX.value = touch.clientX;
  touchEndY.value = touch.clientY;
};
const handleTouchMove = (event) => {
  const touch = event.touches ? event.touches[0] : event;
  touchEndX.value = touch.clientX;
  touchEndY.value = touch.clientY;
};
const handleTouchEnd = () => {
  const deltaX = touchEndX.value - touchStartX.value;
  const deltaY = touchEndY.value - touchStartY.value;
  if (Math.abs(deltaX) > touchThreshold && Math.abs(deltaX) > Math.abs(deltaY)) {
    if (deltaX < 0) {
      // 左滑，下一题
      handleNextQuestion();
    } else {
      // 右滑，上一题
      handlePrevQuestion();
    }
  }
  touchStartX.value = 0;
  touchEndX.value = 0;
  touchStartY.value = 0;
  touchEndY.value = 0;
};
// --- end 滑动切换题目相关 ---

const goBack = () => {
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  // 使用let而不是const声明options，避免重复声明
  let options;
  // #ifdef H5
  options = currentPage.options || currentPage.$page?.options || {};
  // #else
  options = currentPage.options || {};
  // #endif

  const { studentId, startTime, endTime, knowledgePointId } = options;
  let url = '';
  if (knowledgePointId) {
    url = `/pages/mine/situation/index?studentId=${encodeURIComponent(studentId || '')}&startTime=${encodeURIComponent(startTime || '')}&endTime=${encodeURIComponent(endTime || '')}&knowledgePointId=${encodeURIComponent(knowledgePointId)}`;
  } else {
    url = `/pages/mine/wrongQuestions/index?studentId=${encodeURIComponent(studentId || '')}&startTime=${encodeURIComponent(startTime || '')}&endTime=${encodeURIComponent(endTime || '')}`;
  }

  if (pages.length <= 1) {
    uni.redirectTo({
      url,
      fail: () => {
        uni.navigateTo({ url });
      }
    });
  } else {
    uni.navigateBack();
  }
};

const goToSimilarQuestions = () => {
  console.log("currentQuestion.value", currentQuestion.value);
  if (!currentQuestion.value.qaId) {
    uni.showToast({
      title: '题目ID不存在',
      icon: 'none'
    });
    return;
  }
  uni.navigateTo({
    url: `/pages/mine/wrongquetionrecommand/index?qaId=${currentQuestion.value.qaId}`
  });
};

// 切换答案显示状态
const toggleAnswer = (idx) => {
  showAnswers.value[idx] = !showAnswers.value[idx];
};

// 获取按钮文本
const getAnswerButtonText = (question, show = false) => {
  if (question.type === 1) {
    return show ? '隐藏正确答案' : '查看正确答案';
  } else {
    return show ? '隐藏解析' : '查看解析';
  }
};

const toggleQuestionCard = () => {
  showQuestionCard.value = !showQuestionCard.value;
};

const goToQuestion = (idx) => {
  if (idx >= 0 && idx < questions.value.length) {
    transitionDirection.value = idx > currentIndex.value ? 'left' : 'right';
    currentIndex.value = idx;
    showAnswers.value[currentIndex.value] = false; // 切换题目时隐藏答案
  }
};

const onSwiperChange = (e) => {
  currentIndex.value = e.detail.current;
};
const handlePrevQuestion = () => {
  if (currentIndex.value > 0) currentIndex.value--;
};
const handleNextQuestion = () => {
  if (currentIndex.value < questions.value.length - 1) currentIndex.value++;
};

const isOptionSelected = (value) => {
  const ans = currentQuestion.value.stuAnswer;
  if (!ans) return false;
  if (currentQuestion.value.choiceType === 2) {
    // 多选
    return ans.split('').includes(value);
  }
  return ans === value;
};

const previewImage = (url) => {
  // 收集当前题目所有图片
  const urls = [];
  // 题干图片
  if (currentQuestion.value.textSegments) {
    currentQuestion.value.textSegments.forEach(seg => {
      if (seg.type === 'image' && seg.url) urls.push(seg.url);
    });
  }
  // 选项图片
  if (currentQuestion.value.options) {
    currentQuestion.value.options.forEach(opt => {
      if (opt.segments) {
        opt.segments.forEach(seg => {
          if (seg.type === 'image' && seg.url) urls.push(seg.url);
        });
      }
    });
  }
  // 学生答案图片
  if (currentQuestion.value.imageUrls) {
    currentQuestion.value.imageUrls.forEach(img => {
      if (img) urls.push(img);
    });
  }
  // 解析图片
  if (currentQuestion.value.analysisSegments) {
    currentQuestion.value.analysisSegments.forEach(seg => {
      if (seg.type === 'image' && seg.url) urls.push(seg.url);
    });
  }
  if (urls.length === 0) return;
  uni.previewImage({
    urls,
    current: url
  });
};

// 处理图片URL为base64
async function processImageUrls(imageUrls) {
  if (!imageUrls) return [];
  const urls = typeof imageUrls === 'string' ? imageUrls.split(',').map(u => u.trim()).filter(Boolean) : imageUrls;
  const arr = [];
  for (let i = 0; i < urls.length; i++) {
    const path = urls[i];
    if (!path) continue;
    try {
      const res = await getImageFromMinio(path.startsWith('http') ? new URL(path).pathname : path);
      if (res.flag === '1' && res.result?.imageData) {
        arr.push(`data:${res.result.contentType};base64,${res.result.imageData}`);
      }
    } catch (e) {}
  }
  return arr;
}

const contentHeaderRef = ref(null);
const contentHeaderHeight = ref(60);
// 修改swiperHeight计算
const swiperHeight = computed(() => {
  // 120px为底部按钮区高度，可根据实际调整
  return `calc(100vh - ${headerHeight.value} - 120px)`;
});

onMounted(() => {
  // 移除对getContentHeaderHeight的调用
  // getContentHeaderHeight();
});

onLoad(async (options) => {
  // 解码参数，确保传给 API 的是未编码字符串
  const studentId = options.studentId ? decodeURIComponent(options.studentId) : '';
  const startTime = options.startTime ? decodeURIComponent(options.startTime) : '';
  const endTime = options.endTime ? decodeURIComponent(options.endTime) : '';
  const knowledgePointId = options.knowledgePointId ? decodeURIComponent(options.knowledgePointId) : '';

  if (!studentId || !startTime || !endTime) return;
  console.log('[错题分析] knowledgePointId:', knowledgePointId, 'startTime:', startTime, 'endTime:', endTime);
  uni.showLoading({ title: '加载中...' });
  let res;
  if (knowledgePointId) {
    // 调用新接口：根据知识点查询学生错题
    res = await getWrongQuestionsByKnowledgePoint(studentId, knowledgePointId, startTime, endTime);
    console.log('[错题分析] byKnowledgePoint接口返回:', res);
  } else {
    // 调用原接口
    res = await getWrongQuestionDetails(studentId, startTime, endTime);
    console.log('[错题分析] list接口返回:', res);
  }
  if (res.flag === '1' && res.result) {
    const imageUrlMap = res.result.imageUrlMap || {};
    const details = res.result.wrongQuestionDetails || [];
    // 1. 收集所有videoId
    const allVideoIds = [];
    for (const item of details) {
      const { detailRecord, questionChoice, questionBlank, questionApplication } = item;
      let type = detailRecord.questionsType;
      let question = null;
      if (type === 1) question = questionChoice;
      if (type === 2) question = questionBlank;
      if (type === 3) question = questionApplication;
      if (!question) continue;
      if (question.videoId) allVideoIds.push(question.videoId);
    }
    const uniqueVideoIds = [...new Set(allVideoIds)];
    // 2. 批量请求视频URL
    let videoUrlMap = {};
    if (uniqueVideoIds.length > 0) {
      const videoRes = await getVideoPreSignedUrls(uniqueVideoIds);
      if (videoRes.flag === '1' && videoRes.result) {
        videoUrlMap = videoRes.result;
      }
    }
    // 分类
    const choice = [], blank = [], application = [];
    let idx = 1;
    for (const item of details) {
      const { detailRecord, questionChoice, questionBlank, questionApplication } = item;
      let type = detailRecord.questionsType;
      let question = null;
      if (type === 1) question = questionChoice;
      if (type === 2) question = questionBlank;
      if (type === 3) question = questionApplication;
      if (!question) continue;
      // 题干
      const textSegments = await parseMathText(question.queStem || '', imageUrlMap);
      // 选项
      let options = [];
      if (type === 1) {
        for (const opt of ['A', 'B', 'C', 'D']) {
          if (question['option' + opt]) {
            options.push({
              label: opt,
              segments: await parseMathText(question['option' + opt], imageUrlMap),
              value: opt
            });
          }
        }
      }
      // 学生图片答案
      let imageUrls = [];
      if (detailRecord.imageUrls) {
        imageUrls = await processImageUrls(detailRecord.imageUrls);
      }
      // 解析
      const analysisSegments = await parseMathText(detailRecord.analysis || '', imageUrlMap);
      // 视频处理
      const videoId = question.videoId;
      let videoUrl = null;
      if (videoId && videoUrlMap[videoId] && videoUrlMap[videoId].preSignedUrl) {
        videoUrl = import.meta.env.VITE_VIDEO_BASE_URL + videoUrlMap[videoId].preSignedUrl;
      }
      // 组装
      const q = {
        idx: idx++,
        type,
        choiceType: question.choiceType,
        textSegments,
        options,
        stuAnswer: detailRecord.stuAnswer,
        imageUrls,
        score: detailRecord.score,
        value: detailRecord.value,
        analysisSegments,
        teacherComment: detailRecord.teacherComment,
        correctAnswer: question.correctAnswer,
        qaId: question.qaId || question.qbId || question.qcId || null,
        videoId,
        videoUrl,
      };
      if (type === 1) choice.push(q);
      if (type === 2) blank.push(q);
      if (type === 3) application.push(q);
    }
    questions.value = [...choice, ...blank, ...application];
    showAnswers.value = new Array(questions.value.length).fill(false);
    console.log('[错题分析] 最终渲染题目数量:', questions.value.length);
  }
  uni.hideLoading();
});
</script>

<style scoped>
.wrong-analysis-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8f8ff 0%, #e0e7ff 100%);
  display: flex;
  flex-direction: column;
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
  height: v-bind(headerHeight);
  padding-top: v-bind(statusBarHeight + 'px');
}
.left-section {
  display: flex;
  align-items: center;
  height: 100%;
  width: 80rpx; /* 稍微增加宽度 */
  margin-left: 10rpx;
}
.center-section {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  flex: 1; /* 占用剩余空间 */
}
.header-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}
/* 右侧区域样式 */
.right-section {
  display: flex;
  align-items: center;
  height: 100%;
  gap: 35rpx; /* 增加图标间距 */
  justify-content: flex-end;
  width: 140rpx; /* 稍微增加宽度，使布局更平衡 */
  margin-right: 10rpx;
}
.back-button {
  width: 60rpx;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  height: 100%;
}
.question-content-wrapper {
  flex: 1;
  margin-top: v-bind(headerHeight);
  padding-bottom: 200rpx;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  /* 移除 padding-top: 60px; */
}

/* 不再需要的content-header相关样式，可以注释掉 */
/*
.content-header {
  position: static;
}
.paper-title-in-content {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  text-align: center;
  margin-bottom: 20rpx;
}
.content-header-icons {
  margin: 10rpx;
  padding: 10rpx;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 40rpx;
  z-index: 1;
}
.header-divider {
  width: 100%;
  height: 2rpx;
  background: #e0e0e0;
  margin: 10rpx 0 0 0;
}
*/
.question-counter {
  font-size: 28rpx;
  color: #555;
  display: flex;
  align-items: center;
  justify-content: center;
}
.current-index {
  color: #0057b7;
  font-weight: bold;
  font-size: 32rpx;
}
.header-icon {
  cursor: pointer;
}
/* datika 答题卡图标样式 */
.datika-icon {
  width: 22px;
  height: 22px;
  display: inline-block;
  vertical-align: middle;
  cursor: pointer;
}
.questions-swiper, .swiper-item, .question-scroll {
  height: 100%;
  width: 100%;
}
.question-scroll {
  height: 100%;
  width: 100%;
  box-sizing: border-box;
  padding: 0 20rpx;
}
.question-main {
  padding: 20rpx;
  min-height: 100%;
  box-sizing: border-box;
  border-radius: 8rpx;
  width: 100%;
  overflow: hidden;
}
.question-score-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
  padding: 0 0rpx;
}
.score-label.left {
  text-align: left;
  flex: 1;
  color: #333;
  font-size: 32rpx;
  font-weight: bold;
}
.score-label.right {
  text-align: right;
  flex: 1;
  color: #333;
  font-size: 32rpx;
  font-weight: bold;
  margin-right: 40rpx;
}
.question-stem-content,
.option-text-content,
.analysis-text {
  line-height: 1.6;
  word-break: break-word;
  font-size: 0;
}
.question-stem-content text,
.option-text-content text,
.analysis-text text {
  vertical-align: middle;
  font-size: 34rpx;
}
.mathjax-container {
  display: inline-block;
  vertical-align: middle;
  font-size: 30rpx;
}
.question-content-image,
.option-content-image,
.analysis-content-image {
  max-width: 40%;
  height: auto;
  display: block;
  margin: 10rpx auto;
  border-radius: 8rpx;
}
.answer-area {
  margin-top: 30rpx;
  width: 100%;
  box-sizing: border-box;
}
.choice-item {
  border-radius: 8rpx;
  padding: 20rpx;
  margin-bottom: 15rpx;
  display: flex;
  align-items: center;
  transition: all 0.3s ease;
  border: 2rpx solid transparent;
  background-color: transparent;
  width: 100%;
  box-sizing: border-box;
}
.choice-item.selected {
  background-color: #e6f3ff;
  border-color: #007aff;
  box-shadow: 0 2rpx 8rpx rgba(0, 122, 255, 0.1);
}
.option-label {
  font-size: 30rpx;
  color: #007aff;
  margin-right: 20rpx;
  width: 50rpx;
  height: 50rpx;
  border: 2rpx solid #007aff;
  background-color: transparent;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all 0.3s ease;
}
.choice-item.selected .option-label {
  background-color: #007aff;
  border-color: #007aff;
  color: #fff;
}
.unsupported-tip {
  background-color: #fff;
  border: 1rpx dashed #ccc;
  border-radius: 8rpx;
  padding: 30rpx;
  text-align: center;
  color: #999;
  font-size: 28rpx;
  line-height: 1.5;
  display: flex;
  flex-direction: column;
}
.student-answer {
  margin-top: 20rpx;
  padding: 20rpx;
  background-color: #f9f9f9;
  border-radius: 8rpx;
  border: 1rpx solid #eee;
}
.answer-label {
  font-size: 28rpx;
  font-weight: bold;
  color: #555;
  margin-right: 10rpx;
  display: block;
  margin-bottom: 10rpx;
}
.image-preview-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
  margin-top: 10rpx;
}
.image-preview-item {
  width: 150rpx;
  height: 150rpx;
  border-radius: 8rpx;
  overflow: hidden;
}
.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.analysis-section {
  margin-top: 30rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid #eee;
}
.analysis-label {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 10rpx;
  display: block;
}
.analysis-text {
  font-size: 28rpx;
  color: #555;
  line-height: 1.6;
}
.similar-questions-section {
  margin-top: 30rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid #eee;
  display: flex;
  justify-content: center;
}
.similar-questions-btn {
  background: linear-gradient(135deg, #5ac8fa 0%, #007aff 100%);
  color: #fff;
  border: none;
  border-radius: 50rpx;
  padding: 10rpx 30rpx;
  font-size: 28rpx;
  display: flex;
  align-items: center;
  gap: 12rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 122, 255, 0.3);
  transition: all 0.3s ease;
}
.similar-questions-btn:active {
  transform: scale(0.95);
  box-shadow: 0 2rpx 8rpx rgba(0, 122, 255, 0.2);
}
.similar-btn-text {
  font-weight: 500;
}

/* 答案按钮样式 */
.question-actions-row {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 80rpx;
  margin: 30rpx 0;
}

.similar-questions-btn,
.answer-button {
  margin: 0;
}

.answer-button {
  background: linear-gradient(135deg, #007aff 0%, #5ac8fa 100%);
  color: #fff;
  border: none;
  padding: 10rpx 30rpx;
  border-radius: 50rpx;
  font-size: 28rpx;
  font-weight: 500;
  width: 37%;
  transition: all 0.3s ease;
  box-shadow: 0 3rpx 10rpx rgba(0, 122, 255, 0.3);
}

.answer-button.answered {
  background: linear-gradient(135deg, #ff6b6b 0%, #ffa500 100%);
  box-shadow: 0 3rpx 10rpx rgba(255, 107, 107, 0.3);
}

.answer-button:active {
  transform: scale(0.98);
}

/* 答案详情样式 */
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
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 15rpx;
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

.analysis-content {
  font-size: 28rpx;
  color: #555;
  line-height: 1.6;
  word-break: break-word;
  font-size: 0;
}

.analysis-content text {
  vertical-align: middle;
  font-size: 28rpx;
}

.analysis-content .mathjax-container {
  display: inline-block;
  vertical-align: middle;
  font-size: 28rpx;
}
.teacher-comment-section {
  margin-top: 20rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid #eee;
}
.comment-label {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 10rpx;
  display: block;
}
.comment-content-text {
  font-size: 28rpx;
  color: #555;
  line-height: 1.6;
  word-break: break-word;
}
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
  background-color: #f5f5f5;
  color: #666;
}
.next-button {
  background-color: #007aff;
  color: #fff;
}
/* 答题卡样式 */
.question-card-overlay {
  position: fixed;
  top: v-bind(headerHeight);
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  visibility: hidden;
  opacity: 0;
  transition: visibility 0.3s, opacity 0.3s;
}
.question-card-overlay.show {
  visibility: visible;
  opacity: 1;
}
.question-card-content {
  width: 100%;
  background-color: #fff;
  display: flex;
  flex-direction: column;
  height: calc(100vh - v-bind(headerHeight));
  transform: translateX(100%);
  transition: transform 0.3s;
}
.question-card-overlay.show .question-card-content {
  transform: translateX(0);
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx;
  border-bottom: 1rpx solid #eee;
}
.card-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}
.card-close-icon {
  font-size: 48rpx;
  color: #333;
  cursor: pointer;
  line-height: 1;
  padding: 0;
  margin: 0;
}
.card-body {
  flex: 1;
  padding: 20rpx;
  overflow-y: auto;
}
.question-number-list {
  display: flex;
  flex-wrap: wrap;
  gap: 30rpx;
  justify-content: flex-start;
}
.question-number-item {
  width: 100rpx;
  height: 100rpx;
  border: 1rpx solid #ccc;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 28rpx;
  color: #555;
  cursor: pointer;
  margin-right: 16rpx;
  margin-bottom: 16rpx;
}
.question-number-item.current {
  background-color: #007aff;
  color: #fff;
  border-color: #007aff;
}
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 70vh;
  color: #999;
  font-size: 28rpx;
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
/* 丝滑左右滑动动画 */
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: transform 0.3s ease;
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
}
.slide-left-leave-active,
.slide-right-leave-active {
  z-index: 1;
}
.slide-left-enter-active,
.slide-right-enter-active {
  z-index: 2;
}
.slide-left-enter-from {
  transform: translateX(100%);
}
.slide-left-leave-to {
  transform: translateX(-100%);
}
.slide-right-enter-from {
  transform: translateX(-100%);
}
.slide-right-leave-to {
  transform: translateX(100%);
}
</style>
