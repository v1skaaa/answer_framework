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
                <uni-icons :type="examStore.favoritedQuestionIds.has(examStore.currentQuestion.id) ? 'star-filled' : 'star'" size="24" :color="examStore.favoritedQuestionIds.has(examStore.currentQuestion.id) ? '#ffb300' : '#333'" class="header-icon" @click="examStore.toggleFavorite(examStore.currentQuestion.id)"></uni-icons> <!-- 选择题收藏 -->
                <!-- <view v-else class="header-icon-placeholder"></view> --> <!-- 其他题型占位符 -->
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
                             <MathJax v-else-if="segment.type === 'formula'" :formula="segment.content" :displayMode="segment.displayMode"></MathJax>
                         </template>
                    </view>
                    <image v-if="examStore.currentQuestion.image" :src="examStore.currentQuestion.image" mode="widthFix" class="question-image"></image>

                    <!-- 答案区域 -->
                    <view class="answer-area">
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
                            <!-- 填空题和解答题的拍照上传功能 -->
                            <view class="upload-section">
                                <view class="upload-header">
                                    <text class="upload-title">拍照上传答案</text>
                                    <text class="upload-tip">最多上传3张图片</text>
                                </view>
                                
                                <!-- 已上传图片预览 -->
                                <view class="image-preview-list" v-if="examStore.currentQuestionImages.length > 0">
                                    <view 
                                        class="image-preview-item" 
                                        v-for="(image, index) in examStore.currentQuestionImages" 
                                        :key="index"
                                    >
                                        <image 
                                            :src="`data:image/jpeg;base64,${image.base64}`" 
                                            mode="aspectFill" 
                                            class="preview-image"
                                            @click="previewImage(index)"
                                        ></image>
                                        <view class="image-actions">
                                            <view class="delete-btn" @click="deleteImage(index)">
                                                <uni-icons type="trash" size="20" color="#ff4d4f"></uni-icons>
                                            </view>
                                        </view>
                                    </view>
                                </view>

                                <!-- 上传按钮 -->
                                <view 
                                    class="upload-btn" 
                                    v-if="examStore.currentQuestionImages.length < 3"
                                    @click="chooseAndUploadImage"
                                >
                                    <uni-icons type="camera" size="24" color="#007aff"></uni-icons>
                                    <text>拍照上传</text>
                                </view>
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
                        <!-- 填空题和解答题的拍照上传功能 -->
                        <view class="upload-section">
                            <view class="upload-header">
                                <text class="upload-title">拍照上传答案</text>
                                <text class="upload-tip">最多上传3张图片</text>
                            </view>
                            
                            <!-- 已上传图片预览 -->
                            <view class="image-preview-list" v-if="examStore.currentQuestionImages.length > 0">
                                <view 
                                    class="image-preview-item" 
                                    v-for="(image, index) in examStore.currentQuestionImages" 
                                    :key="index"
                                >
                                    <image 
                                        :src="`data:image/jpeg;base64,${image.base64}`" 
                                        mode="aspectFill" 
                                        class="preview-image"
                                        @click="previewImage(index)"
                                    ></image>
                                    <view class="image-actions">
                                        <view class="delete-btn" @click="deleteImage(index)">
                                            <uni-icons type="trash" size="20" color="#ff4d4f"></uni-icons>
                                        </view>
                                    </view>
                                </view>
                            </view>

                            <!-- 上传按钮 -->
                            <view 
                                class="upload-btn" 
                                v-if="examStore.currentQuestionImages.length < 3"
                                @click="chooseAndUploadImage"
                            >
                                <uni-icons type="camera" size="24" color="#007aff"></uni-icons>
                                <text>拍照上传</text>
                            </view>
                        </view>
                    </template>
                </view>
            </view>
        </view>

        <!-- 添加导航按钮区域 -->
        <view class="navigation-buttons">
            <!-- 第一题：只显示下一题按钮 -->
            <template v-if="examStore.currentQuestionIndex === 0">
                <view class="single-button-container">
                    <button class="nav-button next-button" @click="handleNextQuestion">
                        下一题
                    </button>
                </view>
            </template>
            
            <!-- 最后一题：显示上一题和答题卡按钮 -->
            <template v-else-if="examStore.currentQuestionIndex === examStore.totalQuestions - 1">
                <view class="dual-button-container">
                    <button class="nav-button prev-button" @click="handlePrevQuestion">
                        上一题
                    </button>
                    <button class="nav-button card-button" @click="examStore.toggleQuestionCard">
                        答题卡
                    </button>
                </view>
            </template>
            
            <!-- 中间题目：显示上一题和下一题按钮 -->
            <template v-else>
                <view class="dual-button-container">
                    <button class="nav-button prev-button" @click="handlePrevQuestion">
                        上一题
                    </button>
                    <button class="nav-button next-button" @click="handleNextQuestion">
                        下一题
                    </button>
                </view>
            </template>
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
        // 使用更长的延迟，确保 DOM 稳定
        setTimeout(() => {
             uni.createSelectorQuery().select('.content-header').boundingClientRect(rect => {
                if (rect && rect.height) {
                    contentHeaderHeight.value = rect.height;
                     console.log('contentHeaderHeight:', contentHeaderHeight.value);
                } else {
                    console.warn('Failed to get .content-header height. Using default.');
                    // 提供一个默认值以防获取失败
                    contentHeaderHeight.value = 100; // 调整为一个合理的默认值
                }
            }).exec();
        }, 200); // 增加延迟到 200ms
    });
    // #endif
    // #ifndef MP-WEIXIN || H5 || APP-VUE
     console.warn('当前平台获取元素高度的方法未实现，请手动调整样式或实现对应平台的元素高度获取。');
     // 提供一个默认值以防获取失败
     contentHeaderHeight.value = 100; // 调整为一个合理的默认值
    // #endif
};

// 返回上一页
const goBack = () => {
  examStore.stopTimer();
  uni.navigateBack();
};

// 选择并上传图片
const chooseAndUploadImage = async () => {
    try {
        const res = await uni.chooseImage({
            count: 1,
            sizeType: ['compressed'],
            sourceType: ['camera', 'album']
        });

        if (res.tempFilePaths && res.tempFilePaths.length > 0) {
            const success = await examStore.uploadImage(res.tempFilePaths[0]);
            if (success) {
                uni.showToast({
                    title: '上传成功',
                    icon: 'success'
                });
            }
        }
    } catch (error) {
        console.error('选择图片失败:', error);
        uni.showToast({
            title: '选择图片失败',
            icon: 'none'
        });
    }
};

// 预览图片
const previewImage = (index) => {
    const images = examStore.currentQuestionImages.map(img => `data:image/jpeg;base64,${img.base64}`);
    uni.previewImage({
        urls: images,
        current: index
    });
};

// 删除图片
const deleteImage = (index) => {
    uni.showModal({
        title: '确认删除',
        content: '确定要删除这张图片吗？',
        success: (res) => {
            if (res.confirm) {
                examStore.removeImage(examStore.currentQuestion.id, index);
                uni.showToast({
                    title: '删除成功',
                    icon: 'success'
                });
            }
        }
    });
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
  // 获取胶囊按钮位置信息
  // #ifdef MP-WEIXIN
  const menuButtonInfo = wx.getMenuButtonBoundingClientRect();
  menuButtonHeight.value = menuButtonInfo.height;
  menuButtonTop.value = menuButtonInfo.top;
  // #endif

  // 启动倒计时
  examStore.startTimer();

  // 初始获取 content-header 的高度 (首次加载数据时会触发 questions 监听，在那里会重新计算，这里可以不需要初始调用)
  // getContentHeaderHeight();

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
    // loadQuestions 会更新 examStore.questions，从而触发 watch 监听
    examStore.loadQuestions(sourceId);
  } else {
    console.warn('answering: No sourceId received from options.');
    uni.showToast({
      title: '未获取到试卷ID',
      icon: 'none'
    });
  }
});

// Add a watcher to see when questions in the store changes
watch(() => examStore.questions, (newValue, oldValue) => {
    console.log('answering: examStore.questions changed. Total questions:', newValue.length);
    // When questions load, reset current question index to 0 to show the first question
    if (newValue && newValue.length > 0) {
        examStore.currentQuestionIndex = 0;
        // 在 questions 更新后重新计算 content-header 的高度
        getContentHeaderHeight();
    }
}, { immediate: true }); // Immediate: true will fire the watcher immediately on component creation

watch(() => examStore.paperTitle, (newValue, oldValue) => {
    console.log('answering: examStore.paperTitle changed from', oldValue, 'to', newValue);
}, { immediate: true });

// Need to expose store state and actions to the template
// The setup script already does this automatically with useExamStore()

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
  transition: all 0.3s ease;
  border: 2rpx solid transparent;
  background-color: transparent;

  &:last-child {
    margin-bottom: 0;
  }

  &.selected {
    background-color: #e6f3ff;
    border-color: #007aff;
    box-shadow: 0 2rpx 8rpx rgba(0, 122, 255, 0.1);
  }

  &:active {
    transform: scale(0.98);
  }
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
  flex: 1;
  font-size: 30rpx;
  color: #333;
  line-height: 1.5;
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

/* 上传区域样式 */
.upload-section {
    background-color: #fff;
    border-radius: 12rpx;
    padding: 20rpx;
    margin-top: 20rpx;
}

.upload-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20rpx;
}

.upload-title {
    font-size: 32rpx;
    color: #333;
    font-weight: bold;
}

.upload-tip {
    font-size: 24rpx;
    color: #999;
}

.image-preview-list {
    display: flex;
    flex-wrap: wrap;
    gap: 20rpx;
    margin-bottom: 20rpx;
}

.image-preview-item {
    position: relative;
    width: 200rpx;
    height: 200rpx;
    border-radius: 8rpx;
    overflow: hidden;
}

.preview-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.image-actions {
    position: absolute;
    top: 0;
    right: 0;
    padding: 10rpx;
}

.delete-btn {
    width: 40rpx;
    height: 40rpx;
    background-color: rgba(0, 0, 0, 0.5);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.upload-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 200rpx;
    height: 200rpx;
    background-color: #f5f5f5;
    border: 2rpx dashed #ddd;
    border-radius: 8rpx;
    cursor: pointer;
}

.upload-btn text {
    font-size: 24rpx;
    color: #666;
    margin-top: 10rpx;
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

.single-button-container {
    display: flex;
    justify-content: center;
    width: 100%;
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

.card-button {
    background-color: #e45656;
    color: #fff;
}

/* 调整内容区域底部间距，为导航按钮留出空间 */
.question-content {
    padding-bottom: 160rpx;
}

</style> 