<template>
  <view class="exam-answering-container" :style="{ paddingTop: containerPaddingTop }">
    <!-- 自定义头部 (仅保留返回按钮) -->
    <view class="header-bar" :style="{ height: headerHeight, paddingTop: statusBarHeight + 'px' }">
      <view class="left-section">
        <view class="back-button" @click="goBack">
          <uni-icons type="left" size="24" color="#333"></uni-icons>
        </view>
      </view>
       <view class="right-section"></view> <!-- 右侧占位符以保持返回按钮居左 -->
    </view>

    <!-- 题目内容区域容器，添加触摸事件监听 -->
    <!-- 设置相对定位和隐藏溢出 -->
    <view 
        class="question-content-wrapper"
        @touchstart="handleTouchStart"
        @touchmove="handleTouchMove"
        @touchend="handleTouchEnd"
        >
        <!-- 将试卷名称和右侧元素放在这里，在返回按钮下方 -->
        <!-- 添加 ref 引用 -->
        <view class="content-header" ref="contentHeaderRef">
            <view class="paper-title-in-content">{{ examStore.paperTitle }}</view> <!-- 试卷名称 -->
             <view class="content-header-icons">
                <text class="question-counter">{{ examStore.currentQuestionIndex + 1 }} / {{ examStore.totalQuestions }}</text> <!-- 题目标号和总数 -->
                <!-- 根据当前题目类型显示不同的收藏图标或占位符 -->
                <uni-icons v-if="examStore.currentQuestion.type === 'choice'" type="star" size="24" color="#333" class="header-icon"></uni-icons> <!-- 选择题收藏 -->
                <view v-else class="header-icon-placeholder"></view> <!-- 其他题型占位符 -->
                <uni-icons type="bars" size="24" color="#333" class="header-icon" @click="examStore.toggleQuestionCard"></uni-icons> <!-- 答题卡 -->
                <text class="countdown">{{ examStore.formattedTime }}</text> <!-- 倒计时 -->
            </view>
        </view>

        <!-- Use transition component for non-mini-program platforms -->
        <!-- For mini-program, we'll use native animation -->
        <transition :name="'slide-' + transitionDirection" v-if="!isMiniProgram">
            <view 
                class="question-content"
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
<<<<<<< HEAD
                             <MathJax v-else-if="segment.type === 'formula'" :formula="segment.content" :displayMode="segment.displayMode" ></MathJax>
=======
                             <MathJax v-else-if="segment.type === 'formula'" :formula="segment.content" :displayMode="segment.displayMode"></MathJax>
>>>>>>> 14c44b52f3d353d0170c154e784ea08df547776b
                         </template>
                    </view>
                    <image v-if="examStore.currentQuestion.image" :src="examStore.currentQuestion.image" mode="widthFix" class="question-image"></image>

                    <!-- 答案区域 -->
                    <view class="answer-area">
<<<<<<< HEAD
                        <template v-if="examStore.currentQuestion.type === 'choice'">
                            <template v-if="examStore.currentQuestion && examStore.currentQuestion.options && examStore.currentQuestion.options.length > 0">
                                <view 
                                    class="choice-item" 
                                    v-for="(option, optionIndex) in examStore.currentQuestion.options" 
                                    :key="optionIndex"
                                    @click="examStore.selectOption(option.value)"
                                    :class="{'selected': examStore.currentQuestion.selectedAnswers && examStore.currentQuestion.selectedAnswers.includes(option.value)}"
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
=======
                        <template v-if="currentQuestion && currentQuestion.options && currentQuestion.options.length > 0">
                            <view 
                                class="choice-item" 
                                v-for="(option, optionIndex) in currentQuestion.options" 
                                :key="optionIndex"
                                @click="selectOption(option.value)"
                                :class="{'selected': currentQuestion.selectedAnswers && currentQuestion.selectedAnswers.includes(option.value)}"
                                >
                                <text class="option-label">{{ option.label }}</text>
                                 <!-- Render option text with MathJax component -->
                                <view class="option-text-content">
                                    <!-- Iterate through option text segments -->
                                     <template v-for="(segment, segmentIndex) in option.segments" :key="segmentIndex">
                                         <text v-if="segment.type === 'text'">{{ segment.content }}</text>
                                         <MathJax v-else-if="segment.type === 'formula'" :formula="segment.content" :displayMode="segment.displayMode"></MathJax>
                                     </template>
>>>>>>> 14c44b52f3d353d0170c154e784ea08df547776b
                                </view>
                            </template>
                             <template v-else>
                                  <!-- 如果没有选项数据，可以显示一个提示 -->
                                 <view class="unsupported-tip">
                                     <text>本选择题暂无选项数据</text>
                                 </view>
                             </template>
                        </template>

                        <template v-else-if="examStore.currentQuestion.type === 'fill' || examStore.currentQuestion.type === 'application'">
                            <!-- 填空题和解答题暂时不支持作答 -->
                            <view class="unsupported-tip">
                                <text>本题暂不支持输入作答</text>
                            </view>
                        </template>
                    </view>
                </view>
            </view>
        </transition>

         <!-- Content for mini-program using native animation -->
        <view 
            v-if="isMiniProgram"
            class="question-content"
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
<<<<<<< HEAD
                    <template v-if="examStore.currentQuestion.type === 'choice'">
                        <template v-if="examStore.currentQuestion && examStore.currentQuestion.options && examStore.currentQuestion.options.length > 0">
                            <view 
                                class="choice-item" 
                                v-for="(option, optionIndex) in examStore.currentQuestion.options" 
                                :key="optionIndex"
                                @click="examStore.selectOption(option.value)"
                                :class="{'selected': examStore.currentQuestion.selectedAnswers && examStore.currentQuestion.selectedAnswers.includes(option.value)}"
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
=======
                    <template v-if="currentQuestion && currentQuestion.options && currentQuestion.options.length > 0">
                        <view 
                            class="choice-item" 
                            v-for="(option, optionIndex) in currentQuestion.options" 
                            :key="optionIndex"
                            @click="selectOption(option.value)"
                            :class="{'selected': currentQuestion.selectedAnswers && currentQuestion.selectedAnswers.includes(option.value)}"
                            >
                            <text class="option-label">{{ option.label }}</text>
                             <!-- Render option text with MathJax component -->
                            <view class="option-text-content">
                                 <!-- Iterate through option text segments -->
                                 <template v-for="(segment, segmentIndex) in option.segments" :key="segmentIndex">
                                     <text v-if="segment.type === 'text'">{{ segment.content }}</text>
                                     <MathJax v-else-if="segment.type === 'formula'" :formula="segment.content" :displayMode="segment.displayMode"></MathJax>
                                 </template>
>>>>>>> 14c44b52f3d353d0170c154e784ea08df547776b
                            </view>
                        </template>
                         <template v-else>
                              <!-- 如果没有选项数据，可以显示一个提示 -->
                             <view class="unsupported-tip">
                                 <text>本选择题暂无选项数据</text>
                             </view>
                         </template>
                    </template>

                    <template v-else-if="examStore.currentQuestion.type === 'fill' || examStore.currentQuestion.type === 'application'">
                        <!-- 填空题和解答题暂时不支持作答 -->
                        <view class="unsupported-tip">
                            <text>本题暂不支持输入作答</text>
                        </view>
                    </template>
                </view>
            </view>
        </view>

    </view>

    <!-- 答题卡覆盖层 -->
    <view class="question-card-overlay" :class="{'show': examStore.showQuestionCard}" @click="examStore.toggleQuestionCard">
      <view class="question-card-content" @click.stop>
        <view class="card-header">
          <text class="card-title">答题卡</text>
          <text class="card-close-icon" @click="examStore.toggleQuestionCard">×</text>
        </view>
        <scroll-view class="card-body" scroll-y>
          <view class="question-type-section" v-for="(type, typeIndex) in examStore.questionTypes" :key="typeIndex">
            <text class="type-title">{{ type.name }} (共{{ type.count }}题)</text>
            <view class="question-number-list">
              <view 
                class="question-number-item"
                 v-for="(question, qIndex) in type.questions" 
                 :key="qIndex"
                 :class="{'answered': question.answered}"
                 @click="examStore.goToQuestion(question.index)"
                 >
                {{ question.number }}
              </view>
            </view>
          </view>
        </scroll-view>
        <view class="card-footer">
          <button class="submit-button" @click="examStore.submitExam">交卷并查看结果</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
// uni-icons will be automatically imported via easycom
import { onLoad } from '@dcloudio/uni-app';
import { getQuestionList } from '@/api/exam'; // Import the new API function
import MathJax from '@/components/MathJax.vue'; // Import the MathJax component
import { useExamStore } from '@/stores/exam';

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
const runMPAnimation = (direction, callback) => {
    // #ifdef MP-WEIXIN
    if (!animation || isAnimating) {
        if(isAnimating) console.log('正在动画中，忽略本次触发');
        return;
    }

    isAnimating = true;

    if (direction === 'left') {
        if (examStore.currentQuestionIndex < examStore.totalQuestions - 1) {
            examStore.nextQuestion();
        }
    } else {
        if (examStore.currentQuestionIndex > 0) {
            examStore.prevQuestion();
        }
    }

    const moveDistance = direction === 'left' ? '-100%' : '100%';

    animation.translateX(moveDistance).step();
    animationData.value = animation.export();

    setTimeout(() => {
        animation.translateX(direction === 'left' ? '100%' : '-100%').step({ duration: 0 });
        animationData.value = animation.export();

        nextTick(() => {
            animation.translateX(0).step();
            animationData.value = animation.export();
            isAnimating = false;
            if(callback) callback();
        });
    }, 250);
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

  if (isInsideHeader) {
    touchStartX.value = 0;
    touchStartY.value = 0;
    touchEndX.value = 0;
    touchEndY.value = 0;
    return;
  }

  // #ifdef H5
  if (target.classList && (target.classList.contains('choice-item') || 
      target.classList.contains('option-label') || 
      target.classList.contains('option-text'))) {
    touchStartX.value = 0;
    touchStartY.value = 0;
    touchEndX.value = 0;
    touchEndY.value = 0;
    return;
  }
  // #endif

  // #ifdef MP-WEIXIN
  const className = target.className || '';
  if (typeof className === 'string' && (
      className.includes('choice-item') || 
      className.includes('option-label') || 
      className.includes('option-text'))) {
    touchStartX.value = 0;
    touchStartY.value = 0;
    touchEndX.value = 0;
    touchEndY.value = 0;
    return;
  }
  // #endif

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

  if (Math.abs(deltaX) > touchThreshold && Math.abs(deltaX) > Math.abs(deltaY)) {
    if (deltaX < 0) {
      // 向左滑动，显示下一题或打开答题卡
      if (examStore.currentQuestionIndex < examStore.totalQuestions - 1) {
        if (isMiniProgram.value) {
          runMPAnimation('left');
        } else {
          transitionDirection.value = 'left';
          examStore.nextQuestion();
        }
      } else {
        // 已经是最后一题，向左滑动，打开答题卡
        console.log('已经是最后一题，向左滑动，尝试进入答题卡');
        examStore.toggleQuestionCard();
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
        console.log('已经是第一题，向右滑动');
      }
    }
  }

  touchStartX.value = 0;
  touchStartY.value = 0;
  touchEndX.value = 0;
  touchEndY.value = 0;
};

// 获取 content-header 的高度
const contentHeaderRef = ref(null);
const contentHeaderHeight = ref(0);

const getContentHeaderHeight = () => {
    // #ifdef MP-WEIXIN || H5 || APP-VUE
    nextTick(() => {
        setTimeout(() => {
             uni.createSelectorQuery().select('.content-header').boundingClientRect(rect => {
                if (rect && rect.height) {
                    contentHeaderHeight.value = rect.height;
                     console.log('contentHeaderHeight:', contentHeaderHeight.value);
                }
            }).exec();
        }, 50);
    });
    // #endif
    // #ifndef MP-WEIXIN || H5 || APP-VUE
     console.warn('当前平台获取元素高度的方法未实现，请手动调整样式或实现对应平台的元素高度获取。');
    // #endif
};

// 返回上一页
const goBack = () => {
  examStore.stopTimer();
  uni.navigateBack();
};

onMounted(() => {
  // 获取胶囊按钮位置信息
  // #ifdef MP-WEIXIN
  const menuButtonInfo = wx.getMenuButtonBoundingClientRect();
  menuButtonHeight.value = menuButtonInfo.height;
  menuButtonTop.value = menuButtonInfo.top;
  // #endif

  // 启动倒计时
  examStore.startTimer();

  // 获取 content-header 的高度
  getContentHeaderHeight();

  // 初始化小程序动画实例
  initMPAnimation();
});

onUnmounted(() => {
  examStore.stopTimer();
});

onLoad((options) => {
  console.log('answering: Page onLoad', options);
  if (options && options.sourceId) {
    const sourceId = options.sourceId;
    console.log('answering: Received sourceId from options:', sourceId);
    examStore.loadQuestions(sourceId);
  } else {
    console.warn('answering: No sourceId received from options.');
    uni.showToast({
      title: '未获取到试卷ID',
      icon: 'none'
    });
  }
});

// Add a watcher to see when paperTitle in the store changes
watch(() => examStore.paperTitle, (newValue, oldValue) => {
    console.log('answering: examStore.paperTitle changed from', oldValue, 'to', newValue);
}, { immediate: true }); // Immediate: true will fire the watcher immediately on component creation

</script>

<style lang="scss">
/* 页面容器 */
.exam-answering-container {
  padding: 0 20rpx 20rpx 20rpx;
  background: linear-gradient(135deg, #f8f8ff 0%, #e0e7ff 100%);
  min-height: 100vh;
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
  margin-top: 0;

  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  /* height and padding-top are applied via :style */
}

.left-section {
    display: flex;
    align-items: center;
     height: 100%;
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
    flex: 1; /* Restore flex */
    margin-top: 0;
    padding-bottom: 20rpx;
    
    position: relative; /* Restore position */
    overflow: hidden; /* Restore overflow */
     min-height: 0;
     display: flex;
     flex-direction: column;
}

/* 内容头部（包含试卷名称和图标行）*/
.content-header {
    margin-bottom: 40rpx; /* Increase margin-bottom to push content down */
    padding: 0 20rpx;
    /* Ensure it takes up space and clears potential floats */
    display: block; /* Use block display */
    width: 100%;
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
    align-items: center;
    justify-content: flex-end;
    gap: 20rpx;
    padding-right: 30rpx; /* Add padding to the right to shift icons left */
}

.question-counter {
    font-size: 28rpx;
    color: #555;
}

.header-icon {
    cursor: pointer;
}

.header-icon-placeholder {
  width: 48rpx; /* Match icon size */
  height: 24px; /* Match icon size */
}

.countdown {
    font-size: 28rpx;
    color: #e45656;
    margin-left: 10rpx;
}

/* 题目内容区域（进行过渡动画的元素）*/
.question-content {
    position: absolute; /* Restore position */
    left: 0;
    right: 0;
    bottom: 0;
    top: v-bind(contentHeaderHeight + 'px'); /* Positioning below header */
    overflow-y: auto; /* Restore overflow */
    width: 100%;
    height: calc(100% - v-bind(contentHeaderHeight + 'px')); /* Dynamic height */
    /*min-height: 500rpx;*/ /* Remove temporary fixed height */
    will-change: transform; /* Restore will-change */
    // Remove temporary padding
    padding-top: 0;
}

.question-main {
    padding: 0 20rpx;
}

.question-text {
  font-size: 32rpx;
  color: #333;
  margin-bottom: 20rpx;
  line-height: 1.6;
  word-break: break-word;
}

.question-image {
  width: 100%;
  margin-bottom: 20rpx;
  border-radius: 8rpx;
}

.answer-area {
    margin-top: 30rpx;
}

.choice-item {
  border-radius: 8rpx;
  padding: 20rpx;
  margin-bottom: 15rpx;
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: background-color 0.2s ease-in-out, border-color 0.2s ease-in-out;

  &:last-child {
    margin-bottom: 0;
  }

  &.selected {
    background-color: #e0e7ff;
    border-color: #007aff;
  }
}

.option-label {
  font-size: 30rpx;
  font-weight: normal;
  color: #007aff;
  margin-right: 20rpx;
  width: 50rpx;
  height: 50rpx;
  border: 1rpx solid #007aff;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.option-text {
  font-size: 30rpx;
  color: #555;
  flex: 1;
  word-break: break-word;
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

/* 答题卡覆盖层样式 */
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
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx;
  border-bottom: 1rpx solid #eee;
}

.card-header uni-icons {
  /* Attempt to override uni-icons default styling */
  background-color: transparent !important;
  padding: 0 !important;
  border: none !important;
  /* Ensure icon color is correct */
  color: #333 !important;
  /* Also try removing any potential margin */
  margin: 0 !important;
}

.card-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
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
  gap: 60rpx;
}

.question-number-item {
  width: 90rpx;
  height: 90rpx;
  border: 1rpx solid #ccc;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 28rpx;
  color: #555;
  cursor: pointer;

  &.answered {
    background-color: #007aff;
    color: #fff;
    border-color: #007aff;
  }
}

.card-footer {
  padding: 20rpx;
  border-top: 1rpx solid #eee;
}

.submit-button {
  background-color: #e45656;
  color: #fff;
  font-size: 32rpx;
  padding: 15rpx 0;
  border-radius: 50rpx;
  text-align: center;
  cursor: pointer;
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
    overflow-y: auto;
    width: 100%;
    height: calc(100% - v-bind(contentHeaderHeight + 'px'));
    will-change: transform;
}

.question-main {
    padding: 20rpx;
    background-color: #fff;
    min-height: 100%;
    box-sizing: border-box;
}

.card-close-icon {
  font-size: 48rpx; /* Adjust size as needed */
  color: #333; /* Match original color */
  cursor: pointer;
  line-height: 1; /* Ensure character is vertically centered if needed */
  padding: 0;
  margin: 0;
}
/* #endif */

.question-stem-content,
.option-text-content {
  line-height: 1.6;
  word-break: break-word;
  font-size: 0; /* Eliminate space between inline-block elements */
}

/* Style for the MathJax container when in display mode (should act like a block) */
/* We need to target the MathJax component's root element */
/* Since we can't directly add a class based on displayMode prop, we might need to */
/* adjust the MathJax.vue component itself or rely on the displayMode prop affecting */
/* the rendered output structure or add a class conditionally in the template */

/* For now, let's try to ensure text and inline formulas align well */
.question-stem-content text,
.option-text-content text {
  vertical-align: middle;
  font-size: 34rpx; /* Reset font size for question stem text */
}

.option-text-content text {
   font-size: 32rpx; /* Reset font size for option text */
}

/* Assuming MathJax component root is .mathjax-container */
/* Need to find a way to apply block-like behavior conditionally */
/* Let's add a simple margin for now to separate inline elements */
.mathjax-container {
  display: inline-block;
  vertical-align: middle;
  /* margin: 0 2rpx; */ /* Add small horizontal margin for inline formulas */
  font-size: 30rpx; /* Reset font size for inline formulas */

  /* Attempt to make display mode formulas act like blocks */
  /* This might require inspecting the rendered HTML structure by MathJax */
  /* Based on common MathJax SVG output, display mode often gets .MathJax_Display class */
  & uni-view.MathJax_Display { /* Target the inner MathJax display div */
    display: block;
    width: 100%;
    margin: 1em 0; /* Add vertical margin for block formulas */
  }
}

</style> 