<template>
  <view class="exam-analysis-container">
    <!-- Custom Header -->
    <view class="header-bar" :style="{ height: headerHeight, paddingTop: statusBarHeight + 'px' }">
      <view class="left-section">
        <view class="back-button" @click="goBack">
          <uni-icons type="left" size="24" color="#333"></uni-icons>
        </view>
      </view>
      <view class="center-section">
        <text class="header-title">题目解析</text>
      </view>
      <view class="right-section"></view> <!-- Right placeholder -->
    </view>

    <!-- 题目内容区域容器，添加触摸事件监听 -->
    <view
        class="question-content-wrapper"
        :style="{ marginTop: headerHeight }"
    >
        <!-- 将试卷名称和右侧元素放在这里，在返回按钮下方 -->
        <view class="content-header" ref="contentHeaderRef" style="position: static;">
            <!-- <view class="paper-title-in-content">{{ examStore.paperTitle }}</view> --> <!-- 试卷名称 -->
            <!-- <view class="paper-title-in-content">题目解析</view> -->
             <view class="content-header-icons">
                <text class="question-counter">
                  <text class="current-index">{{ currentIndex + 1 }}</text> / {{ examStore.totalQuestions }}
                </text> <!-- 题目标号和总数 -->
                <!-- 收藏图标 -->
                <uni-icons
                  :type="examStore.favoritedQuestionIds.has(currentQuestion?.id) ? 'star-filled' : 'star'"
                  size="24"
                  :color="examStore.favoritedQuestionIds.has(currentQuestion?.id) ? '#ffb300' : '#333'"
                  class="header-icon"
                  @click="examStore.toggleFavorite(currentQuestion?.id)"
                  >
                </uni-icons>
                <!-- 答题卡图标 (在解析页可能不需要答题卡，但保留结构) -->
                <image
                  src="/static/images/datika.png"
                  class="header-icon datika-icon"
                  @click="toggleQuestionCard"
                  mode="widthFix"
                />
             </view>
             <view class="header-divider"></view>
        </view>

        <!-- 题目内容区域（进行过渡动画的元素）-->
        <!-- Use transition component for non-mini-program platforms -->
        <!-- For mini-program, we'll use native animation -->
        <swiper
          v-if="examStore.questions && examStore.questions.length > 0"
          class="questions-swiper"
          :style="{ height: swiperHeight }"
          :current="currentIndex"
          @change="onSwiperChange"
          :duration="300"
        >
          <swiper-item
            v-for="(question, qIndex) in examStore.questions"
            :key="question?.id || qIndex"
            class="swiper-item"
          >
            <scroll-view class="question-scroll" scroll-y="true" :show-scrollbar="false" style="height: 100%; width: 100%;">
              <view class="question-main">
                <!-- 题目内容渲染逻辑，使用question/qIndex替换examStore.currentQuestion/examStore.currentQuestionIndex -->
                <view class="question-score-info">
                    <text class="score-label left" v-if="question.questionScore !== undefined && question.questionScore !== null">
                        本题分值：{{ question.questionScore }}分
                    </text>
                    <text 
                      class="score-label right" 
                      v-if="question.studentScore !== undefined && question.studentScore !== null"
                    >
                      你的得分：
                      <text :style="
                        question.studentScore === 0
                          ? 'color: #F44336;'
                          : (question.studentScore === question.questionScore
                              ? 'color: #4CAF50;'
                              : 'color:rgb(238, 167, 44);')
                      ">
                        {{ question.studentScore }}
                      </text>分
                    </text>
                </view>
                <!-- Render question stem with MathJax component -->
                <view class="question-stem-content">
                     <!-- Iterate through text segments -->
                     <template v-for="(segment, index) in question.textSegments" :key="index">
                         <text v-if="segment.type === 'text'" v-html="segment.content"></text>
                         <MathJax v-else-if="segment.type === 'formula'" :formula="segment.content" :displayMode="segment.displayMode"></MathJax>
                         <image v-else-if="segment.type === 'image'" :src="segment.url" mode="widthFix" class="question-content-image" @click="previewImage(segment.url)"></image>
                     </template>
                </view>
                <image v-if="question.image" :src="question.image" mode="widthFix" class="question-image" @click="previewImage(question.image)"></image>

                <!-- 答案区域 -->
                <view class="answer-area">
                    <!-- Choice Questions Options -->
                    <template v-if="question.originalType === 1">
                        <template v-if="question && question.options && question.options.length > 0">
                            <view
                                class="choice-item"
                                v-for="(option, optionIndex) in question.options"
                                :key="optionIndex"
                                :class="{'selected': question.stuAnswer && question.stuAnswer.includes(option.value)}"
                                >
                                <text class="option-label">{{ option.label }}</text>
                                 <!-- Render option text with MathJax component -->
                                <view class="option-text-content">
                                    <!-- Iterate through option text segments -->
                                     <template v-for="(segment, segmentIndex) in option.segments" :key="segmentIndex">
                                         <text v-if="segment.type === 'text'" v-html="segment.content"></text>
                                         <MathJax v-else-if="segment.type === 'formula'" :formula="segment.content" :displayMode="segment.displayMode"></MathJax>
                                         <image v-else-if="segment.type === 'image'" :src="segment.url" mode="widthFix" class="option-content-image" @click="previewImage(segment.url)"></image>
                                     </template>
                                </view>
                            </view>
                        </template>
                         <template v-else>
                             <view class="unsupported-tip">
                                 <text>本选择题暂无选项数据</text>
                             </view>
                         </template>
                    </template>

                    <!-- 填空题和解答题的已上传图片或文本答案（只保留一份你的答案/教师评语，按钮和v-if包裹正确答案+解析） -->
                    <template v-else-if="question.originalType === 2 || question.originalType === 3">
                        <view class="student-answer">
                            <text class="answer-label">你的答案:</text>
                            <template v-if="question.imageUrls">
                                <view class="image-preview-list">
                                    <view class="image-preview-item" v-for="(imageUrl, index) in (Array.isArray(question.imageUrls) ? question.imageUrls : [question.imageUrls])" :key="index">
                                        <image :src="imageUrl" mode="aspectFill" class="preview-image" @click="previewImage(imageUrl)"></image>
                                     </view>
                                 </view>
                            </template>
                            <template v-else-if="question.stuAnswer">
                                <text>{{ question.stuAnswer }}</text>
                            </template>
                            <text v-else>未作答</text>
                        </view>
                        <view class="teacher-comment-section" v-if="question.teacherComment">
                            <text class="comment-label">教师评语:</text>
                            <view class="comment-content-text">
                                <text>{{ question.teacherComment }}</text>
                            </view>
                        </view>
                        <view class="answer-toggle-btn-container">
                            <button class="answer-toggle-btn"
                              :class="{'answered': showDetailArr[qIndex]}"
                              @click="toggleShowDetail(qIndex)">
                              {{ showDetailArr[qIndex] ? (question.originalType === 1 ? '隐藏解析' : '隐藏正确答案') : (question.originalType === 1 ? '查看解析' : '查看正确答案') }}
                            </button>
                        </view>
                        <view v-if="showDetailArr[qIndex]">
                            <view class="correct-solution-section">
                                <text class="solution-label">正确答案:</text>
                                <view class="solution-content-text">
                                    <template v-if="question.correctAnswerSegments && question.correctAnswerSegments.length > 0">
                                        <template v-for="(segment, index) in question.correctAnswerSegments" :key="index">
                                            <text v-if="segment.type === 'text'">{{ segment.content }}</text>
                                            <MathJax v-else-if="segment.type === 'formula'" :formula="segment.content" :displayMode="segment.displayMode"></MathJax>
                                            <image v-else-if="segment.type === 'image'" :src="segment.url" mode="widthFix" class="solution-content-image" @click="previewImage(segment.url)"></image>
                                        </template>
                                    </template>
                                    <text v-else>暂无答案</text>
                                </view>
                            </view>
                            <view class="analysis-content-text">
                                <text class="analysis-label" style="font-size:38rpx; font-weight: bold;">解析:</text>
                                <view class="analysis-text">
                                    <template v-for="(segment, index) in question.analysisSegments" :key="index">
                                        <text v-if="segment.type === 'text'">{{ segment.content }}</text>
                                        <MathJax v-else-if="segment.type === 'formula'" :formula="segment.content" :displayMode="segment.displayMode"></MathJax>
                                        <image v-else-if="segment.type === 'image'" :src="segment.url" mode="widthFix" class="analysis-content-image" @click="previewImage(segment.url)"></image>
                                    </template>
                                    <text v-if="!question.analysisSegments || question.analysisSegments.length === 0">暂无解析</text>
                                </view>
                            </view>
                            <!-- 视频展示区域（仅在解析展开时显示） -->
                            <view v-if="question.videoUrl" class="question-video-section" style="margin-top: 20rpx;">
                              <text style="color: #333; font-weight: bold; font-size: 38rpx; margin-top: 80rpx; display: block; margin-bottom: 10rpx;">视频讲解：</text>
                              <video :src="question.videoUrl" controls style="width: 100%;"></video>
                            </view>
                        </view>
                    </template>
                </view>

                <!-- 解析信息 -->
                <view class="analysis-section" v-if="question.originalType === 1">
                    <view class="answer-status">
                        <text>正确答案是: <text class="correct-answer-text">{{ question.correctAnswer || '无' }}</text></text>
                        <text>你的答案是: <text :class="{'incorrect-answer-text': question.status === 'incorrect', 'correct-answer-text': question.status === 'correct'}">{{ question.stuAnswer || '未作答' }}</text></text>
                        <text>{{ question.status === 'correct' ? '回答正确' : (question.status === 'incorrect' ? '回答错误' : '') }}</text>
                    </view>
                    <view class="teacher-comment-section" v-if="question.teacherComment">
                        <text class="comment-label">教师评语:</text>
                        <view class="comment-content-text">
                            <text>{{ question.teacherComment }}</text>
                        </view>
                    </view>
                    <view class="answer-toggle-btn-container">
                        <button class="answer-toggle-btn"
                          :class="{'answered': showDetailArr[qIndex]}"
                          @click="toggleShowDetail(qIndex)">
                          {{ showDetailArr[qIndex] ? (question.originalType === 1 ? '隐藏解析' : '隐藏正确答案') : (question.originalType === 1 ? '查看解析' : '查看正确答案') }}
                        </button>
                    </view>
                    <view v-if="showDetailArr[qIndex]">
                        <view class="analysis-content-text">
                            <text class="analysis-label">解析:</text>
                            <view class="analysis-text">
                                <template v-for="(segment, index) in question.analysisSegments" :key="index">
                                    <text v-if="segment.type === 'text'">{{ segment.content }}</text>
                                    <MathJax v-else-if="segment.type === 'formula'" :formula="segment.content" :displayMode="segment.displayMode"></MathJax>
                                    <image v-else-if="segment.type === 'image'" :src="segment.url" mode="widthFix" class="analysis-content-image" @click="previewImage(segment.url)"></image>
                                </template>
                                <text v-if="!question.analysisSegments || question.analysisSegments.length === 0">暂无解析</text>
                            </view>
                        </view>
                        <!-- 视频展示区域（仅在解析展开时显示） -->
                        <view v-if="question.videoUrl" class="question-video-section" style="margin-top: 20rpx;">
                          <text style="color: #333; font-weight: bold; font-size: 38rpx; margin-top: 80rpx; display: block; margin-bottom: 10rpx;">视频讲解：</text>
                          <video :src="question.videoUrl" controls style="width: 100%;"></video>
                        </view>
                    </view>
                </view>
              </view>
            </scroll-view>
          </swiper-item>
        </swiper>

        <!-- 添加导航按钮区域 -->
        <view class="navigation-buttons">
            <view class="dual-button-container">
                <button class="nav-button prev-button" @click="handlePrevQuestion" :disabled="currentIndex === 0">
                    上一题
                </button>
                <button class="nav-button next-button" @click="handleNextQuestion" :disabled="currentIndex === examStore.questions.length - 1">
                    下一题
                </button>
            </view>
        </view>

    </view>

    <!-- 答题卡覆盖层 -->
    <view class="question-card-overlay" :class="{'show': showQuestionCard}" @click="toggleQuestionCard">
      <view class="question-card-content" @click.stop>
        <view class="card-header">
          <text class="card-title">答题卡</text>
          <text class="card-close-icon" @click="toggleQuestionCard">×</text>
        </view>
        <scroll-view class="card-body" scroll-y>
          <view class="question-type-section" v-for="(type, typeIndex) in examStore.resultQuestionSummary" :key="typeIndex">
            <text class="type-title">{{ type.name }} (共{{ type.count }}题)</text>
            <view class="question-number-list">
              <view
                class="question-number-item"
                 v-for="(question, qIndex) in type.questions"
                 :key="qIndex"
                 :class="{'correct': question.status === 'correct', 'incorrect': question.status === 'incorrect', 'unanswered': question.status === 'unanswered'}"
                 @click="goToQuestion(question.originalIndex)"
                 >
                {{ question.number }}
              </view>
            </view>
          </view>
           <!-- 添加图例 -->
            <view class="legend">
                <view class="legend-item">
                    <view class="legend-color correct"></view>
                    <text>正确</text>
                </view>
                <view class="legend-item">
                    <view class="legend-color incorrect"></view>
                    <text>错误</text>
                </view>
                 <view class="legend-item">
                    <view class="legend-color unanswered"></view>
                    <text>未作答</text>
                </view>
            </view>
        </scroll-view>
        <!-- 移除交卷按钮 -->
      </view>
    </view>

  </view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useExamStore } from '@/stores/exam';
import MathJax from '@/components/MathJax.vue'; // Import the MathJax component

// 获取考试 store
const examStore = useExamStore();

// 获取胶囊按钮位置信息和状态栏高度
const menuButtonHeight = ref(0);
const menuButtonTop = ref(0);
// #ifdef MP-WEIXIN
const systemInfo = wx.getWindowInfo();
const statusBarHeight = systemInfo.statusBarHeight;
// #endif
// #ifdef H5
const statusBarHeight = 0;
// #endif

// 判断是否是小程序环境
const isMiniProgram = ref(false);
// #ifdef MP-WEIXIN
isMiniProgram.value = true;
// #endif

// 计算头部总高度 (仅返回按钮部分)
const headerHeight = computed(() => {
  // #ifdef MP-WEIXIN
  return menuButtonTop.value + menuButtonHeight.value + 'px';
  // #endif
  // #ifdef H5
  return (statusBarHeight + 44) + 'px';
  // #endif
  return '0px';
});

// 计算内容区域的顶部内边距 (考虑头部高度)
const containerPaddingTop = computed(() => {
   // #ifdef MP-WEIXIN
  return menuButtonTop.value + menuButtonHeight.value + 'px';
  // #endif
  // #ifdef H5
  return (statusBarHeight + 44) + 'px';
  // #endif
  return '0px';
});

// 获取 content-header 的高度 (包含试卷名称和图标行)
const contentHeaderRef = ref(null);
const contentHeaderHeight = ref(0);

const getContentHeaderHeight = () => {
     // #ifdef MP-WEIXIN || H5 || APP-VUE
     nextTick(() => {
        // 使用更长的延迟，确保 DOM 稳定
        setTimeout(() => {
             uni.createSelectorQuery().select('.content-header').boundingClientRect(rect => {
                if (rect && rect.height) {
                    contentHeaderHeight.value = rect.height;
                     console.log('analysis: contentHeaderHeight:', contentHeaderHeight.value);
                } else {
                    console.warn('analysis: Failed to get .content-header height. Using default.');
                    // 提供一个默认值以防获取失败
                    contentHeaderHeight.value = 60; // 调整为一个合理的默认值，比答题页的默认值小一些
                }
            }).exec();
        }, 200); // 增加延迟
    });
    // #endif
    // #ifndef MP-WEIXIN || H5 || APP-VUE
     console.warn('analysis: 当前平台获取元素高度的方法未实现，请手动调整样式或实现对应平台的元素高度获取。');
     // 提供一个默认值以防获取失败
     contentHeaderHeight.value = 60; // 调整为一个合理的默认值
    // #endif
};

// 返回上一页
const goBack = () => {
    // 尝试获取当前页面路由信息
    const pages = getCurrentPages();
  // uni.navigateBack();
  if (pages.length <= 1) {
    // 从当前 URL 获取参数
    const currentPage = pages[0];
    
    // 构造返回到 intro 页面的 URL
    let url = '/pages/mine/examRecord/index';
    
    // 重新导航到 intro 页面
    uni.switchTab({
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

// 处理上一题按钮点击
const handlePrevQuestion = () => {
    if (isMiniProgram.value) {
        // 小程序环境下的动画
        const animation = uni.createAnimation({
            duration: 250,
            timingFunction: 'ease',
            delay: 0,
            transformOrigin: '50% 50%'
        });
        const nextIndex = examStore.currentQuestionIndex - 1;
        if (nextIndex >= 0 && nextIndex < examStore.totalQuestions) {
            animation.translateX('-100%').step();
            setTimeout(() => {
                examStore.prevQuestion();
                animation.translateX('100%').step({ duration: 0 });
                animation.translateX(0).step();
            }, 250);
        }
    } else {
        // 非小程序环境下的动画
        if (currentIndex.value > 0) {
            currentIndex.value -= 1;
            examStore.currentQuestionIndex = currentIndex.value;
        }
    }
};

// 处理下一题按钮点击
const handleNextQuestion = () => {
    if (isMiniProgram.value) {
        // 小程序环境下的动画
        const animation = uni.createAnimation({
            duration: 250,
            timingFunction: 'ease',
            delay: 0,
            transformOrigin: '50% 50%'
        });
        const nextIndex = examStore.currentQuestionIndex + 1;
        if (nextIndex >= 0 && nextIndex < examStore.totalQuestions) {
            animation.translateX('100%').step();
            setTimeout(() => {
                examStore.nextQuestion();
                animation.translateX('-100%').step({ duration: 0 });
                animation.translateX(0).step();
            }, 250);
        }
    } else {
        // 非小程序环境下的动画
        if (currentIndex.value < examStore.questions.length - 1) {
            currentIndex.value += 1;
            examStore.currentQuestionIndex = currentIndex.value;
        }
    }
};

// New computed property to gather all image URLs for preview
const allQuestionImagesForPreview = computed(() => {
    const urls = [];

    // Add main question image if it exists
    if (examStore.currentQuestion.image) {
        urls.push(examStore.currentQuestion.image);
    }

    // Add images from question stem
    if (examStore.currentQuestion.textSegments) {
        examStore.currentQuestion.textSegments.forEach(segment => {
            if (segment.type === 'image' && segment.url) {
                urls.push(segment.url);
            }
        });
    }

    // Add images from options
    if (examStore.currentQuestion.options) {
        examStore.currentQuestion.options.forEach(option => {
            if (option.segments) {
                option.segments.forEach(segment => {
                    if (segment.type === 'image' && segment.url) {
                        urls.push(segment.url);
                    }
                });
            }
        });
    }

    // Add images from correct answer (solution for fill/application)
    if (examStore.currentQuestion.correctAnswerSegments) {
        examStore.currentQuestion.correctAnswerSegments.forEach(segment => {
            if (segment.type === 'image' && segment.url) {
                urls.push(segment.url);
            }
        });
    }

    // Add images from analysis
    if (examStore.currentQuestion.analysisSegments) {
        examStore.currentQuestion.analysisSegments.forEach(segment => {
            if (segment.type === 'image' && segment.url) {
                urls.push(segment.url);
            }
        });
    }

    // Add student uploaded images
    if (examStore.currentQuestion.imageUrls) {
        // Note: imageUrls can be a string or array, handle both
        const studentImageUrls = Array.isArray(examStore.currentQuestion.imageUrls)
            ? examStore.currentQuestion.imageUrls
            : (examStore.currentQuestion.imageUrls ? examStore.currentQuestion.imageUrls.split(',').map(url => url.trim()) : []);
        studentImageUrls.forEach(url => {
            if (url) {
                urls.push(url);
            }
        });
    }
    
    // Remove duplicates and ensure unique URLs
    return [...new Set(urls)];
});

// Modified previewImage method
const previewImage = (clickedImageUrl) => {
    const urlsToPreview = allQuestionImagesForPreview.value;
    if (urlsToPreview.length > 0) {
        const current = urlsToPreview.indexOf(clickedImageUrl);
        if (current !== -1) {
            uni.previewImage({
                urls: urlsToPreview,
                current: urlsToPreview[current]
            });
        } else {
            console.warn('Clicked image URL not found in the list of images to preview:', clickedImageUrl);
            uni.showToast({
                title: '图片预览失败',
                icon: 'none'
            });
        }
    } else {
        console.warn('No images available for preview.');
        uni.showToast({
            title: '无可预览图片',
            icon: 'none'
        });
    }
};

// 答题卡相关状态和方法
const showQuestionCard = ref(false);
const toggleQuestionCard = () => {
    showQuestionCard.value = !showQuestionCard.value;
};

// 新增：每题的解析/答案显示状态
const showDetailArr = ref([]);

// 监听 questions 加载，初始化 showDetailArr
watch(() => examStore.questions, (newValue) => {
  if (newValue && newValue.length > 0) {
    showDetailArr.value = new Array(newValue.length).fill(false);
  }
}, { immediate: true });

// 切换显示/隐藏
const toggleShowDetail = (index) => {
  showDetailArr.value[index] = !showDetailArr.value[index];
};

const currentIndex = ref(0);
const currentQuestion = computed(() => examStore.questions[currentIndex.value] || {});
watch(() => examStore.questions, (val) => {
  if (val && val.length > 0 && currentIndex.value >= val.length) {
    currentIndex.value = 0;
    examStore.currentQuestionIndex = 0;
  }
});

const onSwiperChange = (e) => {
  currentIndex.value = e.detail.current;
  examStore.currentQuestionIndex = currentIndex.value;
};

const swiperHeight = computed(() => {
  // 120px为底部按钮区高度，可根据实际调整
  return `calc(100vh - ${headerHeight.value} - ${contentHeaderHeight.value}px - 120px)`;
});

// 在setup中添加goToQuestion方法
const goToQuestion = (index) => {
  if (index >= 0 && index < examStore.questions.length) {
    currentIndex.value = index;
    examStore.currentQuestionIndex = index;
    showQuestionCard.value = false;
  }
};

onMounted(() => {
  // 获取胶囊按钮位置信息 (仅微信小程序需要，非必需用于解析页)
  // #ifdef MP-WEIXIN
  const menuButtonInfo = wx.getMenuButtonBoundingClientRect();
  menuButtonHeight.value = menuButtonInfo.height;
  menuButtonTop.value = menuButtonInfo.top;
  // #endif

  // 获取 content-header 的高度 (用于内容区域定位)
  getContentHeaderHeight();
});

onLoad((options) => {
  console.log('analysis: Page onLoad', options);
  if (options && options.recordId) {
    const recordId = options.recordId;
    console.log('analysis: Received recordId from options:', recordId);

    // 调用 store 中的 action 获取考试详情，这会填充 examStore.questions
    examStore.loadExamDetails(recordId);

     // TODO: If you need to navigate to a specific question when loading,
     // you would add logic here based on an optional questionId param.
     // examStore.goToQuestion(index);

  } else {
    console.warn('analysis: No recordId received from options.');
    uni.showToast({
      title: '未获取到考试记录ID',
      icon: 'none'
    });
     // 可以选择返回上一页或者显示错误状态
  }
});

// Add a watcher to see when questions in the store changes
watch(() => examStore.questions, (newValue, oldValue) => {
    console.log('analysis: examStore.questions changed. Total questions:', newValue.length);
    // When questions load, reset current question index to 0 to show the first question
    if (newValue && newValue.length > 0) {
        examStore.currentQuestionIndex = 0;
        // 在 questions 更新后重新计算 content-header 的高度
        getContentHeaderHeight();
    } else if (newValue && newValue.length === 0) {
         // 如果没有题目，也重新计算高度，虽然此时 content-header 可能只有标题
         getContentHeaderHeight();
    }
}, { immediate: true }); // Immediate: true will fire the watcher immediately on component creation

watch(() => examStore.paperTitle, (newValue, oldValue) => {
    console.log('analysis: examStore.paperTitle changed from', oldValue, 'to', newValue);
     // 当试卷标题变化时，也重新计算 content-header 的高度
     getContentHeaderHeight();
}, { immediate: true });

// Need to expose store state and actions to the template
// The setup script already does this automatically with useExamStore()

</script>

<style lang="scss" scoped>
/* 页面容器 */
.exam-analysis-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8f8ff 0%, #e0e7ff 100%);
  display: flex;
  flex-direction: column;
  /* padding-top applied via question-content-wrapper margin-top or content padding */
}

/* 自定义头部 */
.header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20rpx;
  width: 100%;
  box-sizing: border-box;
  background: linear-gradient(135deg, #f8f8ff 0%, #e0e7ff 100%) !important;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  /* height and padding-top are applied via :style */

  /* Add !important to background and remove any conflicting background properties */
  background-color: transparent !important; /* Explicitly remove potential conflicting background-color */
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

/* 右侧占位符样式 */
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

/* 题目内容区域容器 */
.question-content-wrapper {
    flex: 1;
    margin-top: v-bind(headerHeight); /* Position below the header */
    padding-bottom: 200rpx; /* Space for navigation buttons */

    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    // 移除 padding-top: v-bind(contentHeaderHeight + 'px');
}

/* 内容头部（包含试卷名称和图标行）*/
.content-header {
    /* 使用 absolute 定位，使其悬浮在内容区域上方 */
    position: static;
    top: 0;
    left: 0;
    right: 0;
    /* background-color: #fff; /* 添加背景色，避免内容透出来 */
    /* padding: 0 20rpx; /* 保持水平内边距 */
    padding-bottom: 20rpx; /* 保持底边距 */
    display: block;
    width: 100%;
    box-sizing: border-box;
    z-index: 10;
}

.paper-title-in-content {
    font-size: 36rpx;
    font-weight: bold;
    color: #333;
    text-align: center;
    margin-bottom: 20rpx;
}

.content-header-icons {
    display: flex;
    margin: 10rpx;
    padding: 10rpx;
    align-items: center; /* Center items vertically */
    justify-content: flex-end; /* Align items to the right */
    gap: 40rpx; /* 增大间距 */
    padding-right: 0; /* No need for extra padding here */
    z-index: 1; /* Ensure icons are above other elements in content-header */
}
.header-divider {
  width: 100%;
  height: 2rpx;
  background: #e0e0e0;
  margin: 10rpx 0 0 0;
}

.question-counter {
    font-size: 28rpx;
    color: #555;
    line-height: 1; /* Ensure line-height doesn't add extra space */
    display: flex; /* Use flex to better control vertical alignment */
    align-items: center; /* Vertically center text within its own flex container */
}

.header-icon {
    cursor: pointer;
    margin-left: 20rpx; /* Add margin to the left of the icon for spacing from counter */
    display: flex; /* Use flex to better control vertical alignment */
    align-items: center; /* Vertically center icon within its own flex container */
}

/* Assuming uni-icons might render content that needs vertical alignment */
/* Target the potential inner elements if needed, e.g., uni-icons text or image */
/* .header-icon .uni-icons { */
    /* vertical-align: middle; */
/* } */

/* 题目内容区域（进行过渡动画的元素）*/
.question-content {
    position: static;
    width: 100%;
    will-change: transform;
    padding: 0 20rpx; /* 保持水平内边距 */
    box-sizing: border-box;
    overflow-y: visible;
    top: auto;
    left: auto;
    right: auto;
    bottom: auto;
    height: auto;
}

.question-main {
    padding: 20rpx; /* Revert to having full padding */
    min-height: 100%; /* Ensure background covers the area */
    box-sizing: border-box;
    border-radius: 8rpx;
    width: 100%; /* Explicitly set width for inner content area */
    overflow: hidden; /* Hide any potential overflow */
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
  /* 不要斜体，不要 margin-left */
}
.score-label.right {
  text-align: right;
  flex: 1;
  color: #333;
  font-size: 32rpx;
  font-weight: bold;
  margin-right: 40rpx;
}

.question-score-info text {
    /* 确保每个文本元素内部内容不换行，如果需要 */
    white-space: nowrap;
}

.question-stem-content,
.option-text-content,
.analysis-text {
  line-height: 1.6;
  word-break: break-word;
  font-size: 0; /* Eliminate space between inline-block elements */
}

.question-stem-content text,
.option-text-content text,
.analysis-text text {
  vertical-align: middle;
  font-size: 34rpx; /* Reset font size for text */
}

/* Assuming MathJax component root is .mathjax-container */
.mathjax-container {
  display: inline-block;
  vertical-align: middle;
  font-size: 30rpx; /* Reset font size for inline formulas */

  /* Attempt to make display mode formulas act like blocks */
  & uni-view.MathJax_Display,
  & div.MathJax_Display { /* Also target div for H5 */
    display: block;
    width: 100%;
    margin: 1em 0; /* Add vertical margin for block formulas */
  }
}

.question-image {
  width: 100%;
  margin-bottom: 20rpx;
  border-radius: 8rpx;
}

.answer-area {
    margin-top: 30rpx;
    /* Ensure answer-area itself does not cause layout issues */
    /* display: block; is the default, let's ensure it behaves as expected */
    width: 100%; /* Explicitly set width to 100% */
    box-sizing: border-box; /* Include padding/border in width */
}

.choice-item {
  border-radius: 8rpx;
  padding: 20rpx; /* Revert to having padding */
  margin-bottom: 15rpx;
  display: flex;
  align-items: center;
  /* cursor: pointer; */ /* Remove cursor pointer */
  transition: all 0.3s ease;
  border: 2rpx solid transparent;
  background-color: transparent;
  pointer-events: none; /* Disable click events */
  width: 100%; /* Ensure the flex container takes full width relative to its parent */
  box-sizing: border-box; /* Ensure padding is included in width */

  &:last-child {
    margin-bottom: 0;
  }

  &.selected {
    background-color: #e6f3ff;
    border-color: #007aff;
    box-shadow: 0 2rpx 8rpx rgba(0, 122, 255, 0.1);
  }

  /* Remove active state styles */
  /*
  &:active {
    transform: scale(0.98);
  }
  */
}

.option-label {
  font-size: 30rpx;
  font-weight: normal;
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

.option-text-content {
  line-height: 1.6;
  word-break: break-word;
  font-size: 0; /* Eliminate space between inline-block elements */
  flex: 1; /* Make it take available space */
  flex-basis: 0; /* Added to ensure flex: 1 works correctly */
  max-width: 100%; /* Added to prevent overflow */
  min-width: 0; /* Added to allow shrinking */
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

/* 填空题和解答题的答案展示 */
.student-answer {
    margin-top: 20rpx;
    padding: 20rpx;
    background-color: #f9f9f9;
    border-radius: 8rpx;
    border: 1rpx solid #eee;

    .answer-label {
        font-size: 28rpx;
        font-weight: bold;
        color: #555;
        margin-right: 10rpx;
        display: block; /* Make label a block to put answer below */
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
}

/* 解析信息 */
.analysis-section {
    margin-top: 30rpx;
    padding-top: 20rpx;
    border-top: 1rpx solid #eee;

    .answer-status {
        display: flex;
        gap: 30rpx;
        font-size: 28rpx;
        color: #555;
        margin-bottom: 20rpx;
        flex-wrap: wrap; /* Allow wrapping on smaller screens */
    }

    .correct-answer-text {
        color: #4CAF50; /* Green for correct */
        font-weight: bold;
    }

     .incorrect-answer-text {
        color: #F44336; /* Red for incorrect */
        font-weight: bold;
    }

    .analysis-label {
        font-size: 38rpx;
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

    &:active {
        transform: scale(0.98);
    }
}

.prev-button {
    background-color: #f5f5f5;
    color: #666;
}

.next-button {
    background-color: #007aff;
    color: #fff;
}

/* 为非小程序平台添加过渡动画样式 */
/* #ifndef MP-WEIXIN */
/* 滑动过渡动画效果 */
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
    transition: transform 0.3s ease;
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0; /* Position relative to question-content-wrapper */
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

/* 向左滑动动画（下一题） */
.slide-left-enter-from {
    transform: translateX(100%);
}

.slide-left-leave-to {
    transform: translateX(-100%);
}

/* 向右滑动动画（上一题） */
.slide-right-enter-from {
    transform: translateX(-100%);
}

.slide-right-leave-to {
    transform: translateX(100%);
}
/* #endif */

/* 小程序环境下的动画样式 */
/* #ifdef MP-WEIXIN */
.question-content {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 138rpx; /* Position relative to question-content-wrapper */
    top: 0; /* Position relative to question-content-wrapper */
    overflow-y: auto;
    width: 100%;
    will-change: transform;
}

.question-main {
    padding: 20rpx;
    background-color: #fff;
    min-height: 100%;
    box-sizing: border-box;
    border-radius: 8rpx;
}

/* #endif */

/* 答题卡覆盖层样式 */
.question-card-overlay {
  position: fixed;
  /* 将 top 设置为 headerHeight + contentHeaderHeight */
  top: calc(v-bind(headerHeight) + v-bind(contentHeaderHeight)); /* Add both heights */
  left: 0;
  right: 0;
  bottom: 0; /* 延伸到屏幕底部 */
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000; /* 确保在最上层 */
  display: flex; /* 使用 flex 布局 */
  visibility: hidden;
  opacity: 0;
  transition: visibility 0.3s ease-in-out, opacity 0.3s ease-in-out;

  &.show {
    visibility: visible;
    opacity: 1;
  }
}

.question-card-content {
  width: 100%;
  background-color: #fff;
  display: flex;
  flex-direction: column;
  /* 高度计算为屏幕可视高度减去 headerHeight */
  height: calc(100vh - v-bind(headerHeight));
  /* 确保内容区域从左侧滑入 */
  transform: translateX(100%);
  transition: transform 0.3s ease-in-out;
}

.question-card-overlay.show .question-card-content {
  transform: translateX(0); /* 显示时移回原位 */
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx;
  border-bottom: 1rpx solid #eee;
}

/* Adjusting card-header icons if needed, based on answering page styles */
/* card-header uni-icons styles were removed in a previous answering page edit */
/* If needed, re-add them here */

.card-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}

/* Assuming card-close-icon uses default text styling or a specific class */
.card-close-icon {
    font-size: 48rpx; /* Adjust size as needed */
    color: #333; /* Match original color */
    cursor: pointer;
    line-height: 1; /* Ensure character is vertically centered if needed */
    padding: 0;
    margin: 0;
}

.card-body {
  flex: 1;
  padding: 20rpx;
  overflow-y: auto;
}

.question-type-section {
  margin-bottom: 20rpx;
}

.type-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 15rpx;
  display: block;
}

.question-number-list {
  display: flex;
  flex-wrap: wrap;
  gap: 30rpx;
  justify-content: flex-start; /* 将项目对齐到起始位置 */
}

.question-number-item {
  width: 100rpx;
  height: 100rpx;
  border: 1rpx solid #ccc;
  border-radius: 50%; /* 保持圆形的边界半径 */
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 28rpx;
  color: #555;
  cursor: pointer;
  margin-right: 16rpx; /* 水平间隔 */
  margin-bottom: 16rpx; /* 垂直线间距离 */

  /* For the last item in each row of 5, margin-right should be 0 */
  /* This requires :nth-child(5n) which might have compatibility issues or be complex */
  /* Let's rely on the calculated width and margin to mostly handle it */

  &.answered { /* In analysis, use correct/incorrect/unanswered */
    background-color: #007aff;
    color: #fff;
    border-color: #007aff;
  }

  /* Add styles for correct, incorrect, unanswered based on analysis page statuses */
  &.correct {
     background-color: #4CAF50; /* Green */
     color: #fff;
     border-color: #4CAF50;
  }

  &.incorrect {
     background-color: #F44336; /* Red */
     color: #fff;
     border-color: #F44336;
  }

  &.unanswered {
     background-color: #ccc; /* Grey or a different color for unanswered */
     color: #fff; /* Or #555 depending on preference */
     border-color: #ccc;
  }
}

/* styles for legend */
.legend {
    display: flex;
    justify-content: center;
    gap: 30rpx;
    margin-top: 20rpx;
    font-size: 24rpx;
    color: #555;
}

.legend-item {
    display: flex;
    align-items: center;
}

.legend-color {
    width: 30rpx;
    height: 30rpx;
    border-radius: 50%;
    margin-right: 10rpx;
}

.legend-color.correct {
    background-color: #4CAF50;
}

.legend-color.incorrect {
    background-color: #F44336;
}

.legend-color.unanswered {
    background-color: #ccc;
}

/* correct solution section */
.correct-solution-section {
    margin-top: 20rpx; /* Adjust margin as needed */
    padding-top: 20rpx; /* Add padding top */
    border-top: 1rpx solid #eee; /* Add border top */
}

.solution-label {
    font-size: 38rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 10rpx;
    display: block;
}

.solution-content-text {
    font-size: 28rpx;
    color: #555;
    line-height: 1.6;
    word-break: break-word;
    font-size: 0; /* Eliminate space between inline-block elements */
}

.solution-content-text text {
  vertical-align: middle;
  font-size: 28rpx; /* Reset font size for text */
}

/* teacher comment section */
.teacher-comment-section {
    margin-top: 20rpx; /* Similar to solution section */
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

/* New styles for images rendered via <image> component in analysis/solution */
.question-content-image,
.option-content-image,
.analysis-content-image,
.solution-content-image {
  max-width: 40%; /* Set max-width to 40% */
  height: auto; /* Maintain aspect ratio */
  display: block; /* Make it a block element */
  margin: 10rpx auto; /* Center image and add vertical margin */
  border-radius: 8rpx; /* Optional: add some border radius */
}

.answer-toggle-btn-container {
  text-align: center;
  margin: 20rpx 0;
}
.answer-toggle-btn {
  background: linear-gradient(135deg, #007aff 0%, #5ac8fa 100%);
  color: #fff;
  border: none;
  padding: 16rpx 40rpx;
  border-radius: 30rpx;
  font-size: 30rpx;
  font-weight: 500;
  box-shadow: 0 4rpx 15rpx rgba(0, 122, 255, 0.1);
  margin-bottom: 10rpx;
  width: 80%;
  transition: all 0.3s ease;
}
.answer-toggle-btn.answered {
  background: linear-gradient(135deg, #ff6b6b 0%, #ffa500 100%);
  box-shadow: 0 4rpx 15rpx rgba(255, 107, 107, 0.3);
}
.answer-toggle-btn:active {
  opacity: 0.8;
}

/* 只影响解答题/填空题的解析内容 */
.correct-solution-section + .analysis-content-text .analysis-text {
  color: #555;
}

/* datika 答题卡图标样式 */
.datika-icon {
  width: 22px;
  height: 22px;
  display: inline-block;
  vertical-align: middle;
  cursor: pointer;
  margin-right: 16px;
}

.questions-swiper, .swiper-item, .question-scroll {
  height: 100%;
  width: 100%;
}

.current-index {
  color: #0057b7;
  font-weight: bold;
  font-size: 32rpx;
}
</style> 