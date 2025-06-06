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
        @touchstart="handleTouchStart"
        @touchmove="handleTouchMove"
        @touchend="handleTouchEnd"
        >
        <!-- 将试卷名称和右侧元素放在这里，在返回按钮下方 -->
        <view class="content-header">
            <view class="paper-title-in-content">{{ examStore.paperTitle }}</view> <!-- 试卷名称 -->
             <view class="content-header-icons">
                <text class="question-counter">{{ examStore.currentQuestionIndex + 1 }} / {{ examStore.totalQuestions }}</text> <!-- 题目标号和总数 -->
                <!-- 收藏图标 -->
                <uni-icons
                  :type="examStore.favoritedQuestionIds.has(examStore.currentQuestion.id) ? 'star-filled' : 'star'"
                  size="24"
                  :color="examStore.favoritedQuestionIds.has(examStore.currentQuestion.id) ? '#ffb300' : '#333'"
                  class="header-icon"
                  @click="examStore.toggleFavorite(examStore.currentQuestion.id)"
                  >
                </uni-icons>
                <!-- 答题卡图标 (在解析页可能不需要答题卡，但保留结构) -->
                <!-- <uni-icons type="bars" size="24" color="#333" class="header-icon" @click="examStore.toggleQuestionCard"></uni-icons> -->
             </view>
        </view>

        <!-- 题目内容区域（进行过渡动画的元素）-->
        <!-- Use transition component for non-mini-program platforms -->
        <!-- For mini-program, we'll use native animation -->
        <transition :name="'slide-' + transitionDirection" v-if="!isMiniProgram">
            <scroll-view
                class="question-content"
                scroll-y
                :key="examStore.currentQuestion.id"
                :style="{
                    top: contentHeaderHeight + 'px'
                }"
                >
              <!-- Here display question text and images -->
                <view class="question-main">
                    <!-- Render question stem with MathJax component -->
                    <view class="question-stem-content">
                         <!-- Iterate through text segments -->
                         <template v-for="(segment, index) in examStore.currentQuestion.textSegments" :key="index">
                             <text v-if="segment.type === 'text'">{{ segment.content }}</text>
                             <MathJax v-else-if="segment.type === 'formula'" :formula="segment.content" :displayMode="segment.displayMode"></MathJax>
                         </template>
                    </view>
                    <image v-if="examStore.currentQuestion.image" :src="examStore.currentQuestion.image" mode="widthFix" class="question-image"></image>

                    <!-- 答案区域 -->
                    <view class="answer-area">
                        <!-- Choice Questions Options -->
                        <template v-if="examStore.currentQuestion.originalType === 1">
                            <template v-if="examStore.currentQuestion && examStore.currentQuestion.options && examStore.currentQuestion.options.length > 0">
                                <view
                                    class="choice-item"
                                    v-for="(option, optionIndex) in examStore.currentQuestion.options"
                                    :key="optionIndex"
                                    :class="{'selected': examStore.currentQuestion.stuAnswer && examStore.currentQuestion.stuAnswer.includes(option.value)}"
                                    >
                                    <text class="option-label">{{ option.label }}</text>
                                     <!-- Render option text with MathJax component -->
                                    <view class="option-text-content">
                                        <!-- Iterate through option text segments -->
                                         <template v-for="(segment, segmentIndex) in option.segments" :key="segmentIndex">
                                             <text v-if="segment.type === 'text'">{{ segment.content }}</text>
                                             <MathJax v-else-if="segment.type === 'formula'" :formula="segment.content" :displayMode="segment.displayMode"></MathJax>
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

                         <!-- 填空题和解答题的已上传图片或文本答案 -->
                        <template v-else-if="examStore.currentQuestion.originalType === 2 || examStore.currentQuestion.originalType === 3">
                             <view class="student-answer">
                                <text class="answer-label">你的答案:</text>
                                <template v-if="examStore.currentQuestion.imageData && examStore.currentQuestion.imageData.length > 0">
                                     <view class="image-preview-list">
                                         <view class="image-preview-item" v-for="(image, index) in examStore.currentQuestion.imageData" :key="index">
                                             <image :src="image.url" mode="aspectFill" class="preview-image"></image>
                                         </view>
                                     </view>
                                </template>
                                <text v-else-if="examStore.currentQuestion.stuAnswer">{{ examStore.currentQuestion.stuAnswer }}</text>
                                <text v-else>未作答</text>
                             </view>
                        </template>
                    </view>

                    <!-- 解析信息 -->
                    <view class="analysis-section">
                        <template v-if="examStore.currentQuestion.originalType === 1"> <!-- 选择题显示正确答案和判断 -->
                            <view class="answer-status">
                                <text>正确答案是: <text class="correct-answer-text">{{ examStore.currentQuestion.correctAnswer || '无' }}</text></text>
                                <text>你的答案是: <text :class="{'incorrect-answer-text': examStore.currentQuestion.status === 'incorrect', 'correct-answer-text': examStore.currentQuestion.status === 'correct'}">{{ examStore.currentQuestion.stuAnswer || '未作答' }}</text></text>
                                <text>{{ examStore.currentQuestion.status === 'correct' ? '回答正确' : (examStore.currentQuestion.status === 'incorrect' ? '回答错误' : '未作答') }}</text>
                            </view>
                        </template>
                        <view class="analysis-content-text">
                             <text class="analysis-label">解析:</text>
                             <view class="analysis-text">
                                  <!-- Render analysis text with MathJax component -->
                                 <template v-for="(segment, index) in examStore.currentQuestion.analysisSegments" :key="index">
                                     <text v-if="segment.type === 'text'">{{ segment.content }}</text>
                                     <MathJax v-else-if="segment.type === 'formula'" :formula="segment.content" :displayMode="segment.displayMode"></MathJax>
                                 </template>
                                 <text v-if="!examStore.currentQuestion.analysisSegments || examStore.currentQuestion.analysisSegments.length === 0">暂无解析</text>
                             </view>
                        </view>
                    </view>
                </view>
            </scroll-view>
        </transition>

         <!-- Content for mini-program using native animation -->
        <scroll-view
            v-if="isMiniProgram"
            class="question-content"
            scroll-y
            :style="{
                top: contentHeaderHeight + 'px'
            }"
            :animation="animationData"
            >
            <view class="question-main">
                 <!-- Render question stem with MathJax component -->
                <view class="question-stem-content">
                     <!-- Iterate through text segments -->
                     <template v-for="(segment, index) in examStore.currentQuestion.textSegments" :key="index">
                         <text v-if="segment.type === 'text'">{{ segment.content }}</text>
                         <MathJax v-else-if="segment.type === 'formula'" :formula="segment.content" :displayMode="segment.displayMode"></MathJax>
                     </template>
                </view>
                <image v-if="examStore.currentQuestion.image" :src="examStore.currentQuestion.image" mode="widthFix" class="question-image"></image>

                <!-- 答案区域 -->
                <view class="answer-area">
                    <!-- Choice Questions Options -->
                    <template v-if="examStore.currentQuestion.originalType === 1">
                        <template v-if="examStore.currentQuestion && examStore.currentQuestion.options && examStore.currentQuestion.options.length > 0">
                            <view
                                class="choice-item"
                                v-for="(option, optionIndex) in examStore.currentQuestion.options"
                                :key="optionIndex"
                                :class="{'selected': examStore.currentQuestion.stuAnswer && examStore.currentQuestion.stuAnswer.includes(option.value)}"
                                >
                                <text class="option-label">{{ option.label }}</text>
                                 <!-- Render option text with MathJax component -->
                                <view class="option-text-content">
                                    <!-- Iterate through option text segments -->
                                     <template v-for="(segment, segmentIndex) in option.segments" :key="segmentIndex">
                                         <text v-if="segment.type === 'text'">{{ segment.content }}</text>
                                         <MathJax v-else-if="segment.type === 'formula'" :formula="segment.content" :displayMode="segment.displayMode"></MathJax>
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

                    <!-- 填空题和解答题的已上传图片或文本答案 -->
                    <template v-else-if="examStore.currentQuestion.originalType === 2 || examStore.currentQuestion.originalType === 3">
                         <view class="student-answer">
                            <text class="answer-label">你的答案:</text>
                            <template v-if="examStore.currentQuestion.imageData && examStore.currentQuestion.imageData.length > 0">
                                 <view class="image-preview-list">
                                     <view class="image-preview-item" v-for="(image, index) in examStore.currentQuestion.imageData" :key="index">
                                         <image :src="image.url" mode="aspectFill" class="preview-image"></image>
                                     </view>
                                 </view>
                            </template>
                            <text v-else-if="examStore.currentQuestion.stuAnswer">{{ examStore.currentQuestion.stuAnswer }}</text>
                            <text v-else>未作答</text>
                         </view>
                    </template>
                </view>

                 <!-- 解析信息 -->
                <view class="analysis-section">
                    <template v-if="examStore.currentQuestion.originalType === 1"> <!-- 选择题显示正确答案和判断 -->
                        <view class="answer-status">
                            <text>正确答案是: <text class="correct-answer-text">{{ examStore.currentQuestion.correctAnswer || '无' }}</text></text>
                            <text>你的答案是: <text :class="{'incorrect-answer-text': examStore.currentQuestion.status === 'incorrect', 'correct-answer-text': examStore.currentQuestion.status === 'correct'}">{{ examStore.currentQuestion.stuAnswer || '未作答' }}</text></text>
                            <text>{{ examStore.currentQuestion.status === 'correct' ? '回答正确' : (examStore.currentQuestion.status === 'incorrect' ? '回答错误' : '未作答') }}</text>
                        </view>
                    </template>
                    <view class="analysis-content-text">
                         <text class="analysis-label">解析:</text>
                         <view class="analysis-text">
                              <!-- Render analysis text with MathJax component -->
                             <template v-for="(segment, index) in examStore.currentQuestion.analysisSegments" :key="index">
                                 <text v-if="segment.type === 'text'">{{ segment.content }}</text>
                                 <MathJax v-else-if="segment.type === 'formula'" :formula="segment.content" :displayMode="segment.displayMode"></MathJax>
                             </template>
                              <text v-if="!examStore.currentQuestion.analysisSegments || examStore.currentQuestion.analysisSegments.length === 0">暂无解析</text>
                         </view>
                    </view>
                </view>
            </view>
        </scroll-view>

        <!-- 添加导航按钮区域 -->
        <view class="navigation-buttons">
            <view class="dual-button-container">
                <button class="nav-button prev-button" @click="handlePrevQuestion">
                    上一题
                </button>
                <button class="nav-button next-button" @click="handleNextQuestion">
                    下一题
                </button>
            </view>
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

// 用于控制过渡动画方向的变量 (仅用于非小程序平台)
const transitionDirection = ref('left');

// 小程序原生动画相关变量
const animationData = ref({});
let animation = null;
let isAnimating = false;

// 初始化小程序动画实例
const initMPAnimation = () => {
    // #ifdef MP-WEIXIN
    animation = uni.createAnimation({
        duration: 250,
        timingFunction: 'ease',
        delay: 0,
        transformOrigin: '50% 50%'
    });
    // #endif
};

// 运行小程序动画
const runMPAnimation = (direction) => {
    // #ifdef MP-WEIXIN
    if (!animation || isAnimating) {
        if(isAnimating) console.log('正在动画中，忽略本次触发');
        return;
    }

    isAnimating = true;

    const nextIndex = direction === 'left' ? examStore.currentQuestionIndex + 1 : examStore.currentQuestionIndex - 1;

    if (nextIndex >= 0 && nextIndex < examStore.totalQuestions) {
         const moveDistance = direction === 'left' ? '-100%' : '100%';

        animation.translateX(moveDistance).step();
        animationData.value = animation.export();

        setTimeout(() => {
            // Update question index after animation
             if (direction === 'left') {
                 examStore.nextQuestion();
            } else {
                 examStore.prevQuestion();
            }
            // Reset position instantly before next question is rendered
            animation.translateX(direction === 'left' ? '100%' : '-100%').step({ duration: 0 });
            animationData.value = animation.export();

            nextTick(() => {
                // Animate back to original position
                animation.translateX(0).step();
                animationData.value = animation.export();
                isAnimating = false;
            });
        }, 250); // Match animation duration
    } else {
        isAnimating = false; // Reset flag if no navigation occurs
    }
    // #endif
};

// 触摸/滑动检测相关的变量
const touchStartX = ref(0);
const touchEndX = ref(0);
const touchStartY = ref(0);
const touchEndY = ref(0);
const touchThreshold = 50;

const handleTouchStart = (event) => {
  const target = event.target || event.currentTarget;

  // Check if the touch started within the content header area
  // If so, we should not initiate swipe tracking, allowing click events on header icons
  // We need to check if any parent element of the target is .content-header
  let isInsideHeader = false;
  let currentElement = target;
  while (currentElement) {
    // #ifdef H5 || APP-VUE
    if (currentElement.classList && currentElement.classList.contains('content-header')) {
      isInsideHeader = true;
      break;
    }
    // #endif
    // #ifdef MP-WEIXIN
    const className = currentElement.className || '';
    if (typeof className === 'string' && className.includes('content-header')) {
        isInsideHeader = true;
        break;
    }
    // #endif
    currentElement = currentElement.parentElement;
  }

  // Allow clicks on header icons even if inside content-header, by checking the target element specifically
  const isHeaderIcon = target.classList && target.classList.contains('header-icon');

  if (isInsideHeader && !isHeaderIcon) { // Only return if inside header but NOT the header icon
    touchStartX.value = 0;
    touchStartY.value = 0;
    touchEndX.value = 0;
    touchEndY.value = 0;
    return;
  }

  // Prevent swipe if touch starts on interactive elements like options or upload buttons
   const nonSwipeClasses = ['choice-item', 'option-label', 'option-text-content', 'upload-section', 'image-preview-item', 'upload-btn', 'delete-btn', 'answer-area', 'student-answer']; // Added answer-area and student-answer
   let isInteractive = false;
    currentElement = target;
    while (currentElement) {
        // #ifdef H5 || APP-VUE
        if (currentElement.classList && nonSwipeClasses.some(cls => currentElement.classList.contains(cls))) {
             isInteractive = true;
             break;
        }
        // #endif
        // #ifdef MP-WEIXIN
        const className = currentElement.className || '';
        if (typeof className === 'string' && nonSwipeClasses.some(cls => className.includes(cls))) {
            isInteractive = true;
            break;
        }
        // #endif
        currentElement = currentElement.parentElement;
    }

    if (isInteractive) {
         touchStartX.value = 0;
         touchStartY.value = 0;
         touchEndX.value = 0;
         touchEndY.value = 0;
         return;
    }

  touchStartX.value = event.touches[0].clientX;
  touchStartY.value = event.touches[0].clientY;
  touchEndX.value = touchStartX.value;
  touchEndY.value = touchStartY.value;
};

const handleTouchMove = (event) => {
   if (touchStartX.value !== 0 || touchStartY.value !== 0) {
      touchEndX.value = event.touches[0].clientX;
      touchEndY.value = event.touches[0].clientY;
   }
};

const handleTouchEnd = () => {
  if (touchStartX.value === 0 && touchStartY.value === 0) {
    return;
  }

  const deltaX = touchEndX.value - touchStartX.value;
  const deltaY = touchEndY.value - touchStartY.value;

  // Check if it's primarily a horizontal swipe
  if (Math.abs(deltaX) > touchThreshold && Math.abs(deltaX) > Math.abs(deltaY)) {
    if (deltaX < 0) {
      // 向左滑动，显示下一题
      if (examStore.currentQuestionIndex < examStore.totalQuestions - 1) {
        if (isMiniProgram.value) {
          runMPAnimation('left');
        } else {
          transitionDirection.value = 'left';
          examStore.nextQuestion();
        }
      } else {
        console.log('已经是最后一题');
      }
    } else {
      // 向右滑动，显示上一题
      if (examStore.currentQuestionIndex > 0) {
        if (isMiniProgram.value) {
          runMPAnimation('right');
        } else {
          transitionDirection.value = 'right';
          examStore.prevQuestion();
        }
      } else {
        console.log('已经是第一题');
      }
    }
  }

  touchStartX.value = 0;
  touchStartY.value = 0;
  touchEndX.value = 0;
  touchEndY.value = 0;
};

// 获取 content-header 的高度
const contentHeaderRef = ref(null); // Not used in analysis page template, but kept for logic if needed
const contentHeaderHeight = ref(0);

// We don't need to measure header height dynamically here as it's fixed,
// but keeping the logic for completeness or future use if header becomes dynamic.
const getContentHeaderHeight = () => {
     nextTick(() => {
        setTimeout(() => {
            // In analysis page, the header bar is fixed, content padding adjusts for it.
            // We need height for potential content wrapper positioning if not using padding.
            // Let's assume a fixed header height of 44px + status bar for simplicity if not using dynamic measurement.
             const fixedHeaderBaseHeight = 44;
             contentHeaderHeight.value = fixedHeaderBaseHeight + statusBarHeight;
             console.log('analysis: Assumed contentHeaderHeight:', contentHeaderHeight.value);

            // If dynamic measurement is needed, use something like below (requires ref in template):
            /*
            uni.createSelectorQuery().select('.content-header').boundingClientRect(rect => {
                if (rect && rect.height) {
                    contentHeaderHeight.value = rect.height;
                     console.log('analysis: contentHeaderHeight:', contentHeaderHeight.value);
                }
            }).exec();
            */
        }, 50);
    });
};

// 返回上一页
const goBack = () => {
  uni.navigateBack();
};

// 处理上一题按钮点击
const handlePrevQuestion = () => {
    if (isMiniProgram.value) {
        runMPAnimation('right');
    } else {
        transitionDirection.value = 'right';
        examStore.prevQuestion();
    }
};

// 处理下一题按钮点击
const handleNextQuestion = () => {
    if (isMiniProgram.value) {
        runMPAnimation('left');
    } else {
        transitionDirection.value = 'left';
        examStore.nextQuestion();
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

  // 初始化小程序动画实例
  initMPAnimation();
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
    }
}, { immediate: true }); // Immediate: true will fire the watcher immediately on component creation

watch(() => examStore.paperTitle, (newValue, oldValue) => {
    console.log('analysis: examStore.paperTitle changed from', oldValue, 'to', newValue);
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
    padding-bottom: 160rpx; /* Space for navigation buttons */

    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

/* 内容头部（包含试卷名称和图标行）*/
.content-header {
    margin-bottom: 40rpx; /* Increase margin-bottom to push content down */
    padding: 0 20rpx;
    display: block;
    width: 100%;
    box-sizing: border-box; /* Ensure padding is included in width */
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
    align-items: center; /* Center items vertically */
    justify-content: flex-end; /* Align items to the right */
    gap: 20rpx; /* Keep gap for spacing between items */
    padding-right: 0; /* No need for extra padding here */
    z-index: 1; /* Ensure icons are above other elements in content-header */
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
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    top: 0; /* Position relative to question-content-wrapper */
    overflow-y: auto;
    width: 100%; /* Ensure absolute positioned element takes full width */
    height: 100%; /* Take full height of parent */
    will-change: transform;
    padding: 0 20rpx; /* Keep horizontal padding to content */
    box-sizing: border-box; /* Include padding in width/height */
}

.question-main {
    padding: 20rpx; /* Revert to having full padding */
    min-height: 100%; /* Ensure background covers the area */
    box-sizing: border-box;
    border-radius: 8rpx;
    width: 100%; /* Explicitly set width for inner content area */
    overflow: hidden; /* Hide any potential overflow */
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
    bottom: 0;
    top: 0; /* Position relative to question-content-wrapper */
    overflow-y: auto;
    width: 100%;
    height: 100%; /* Take full height of parent */
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

</style> 