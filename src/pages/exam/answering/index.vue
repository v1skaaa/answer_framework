<template>
  <view class="exam-answering-container">
    <!-- 自定义头部 (包含返回按钮和右侧图标) -->
    <view class="header-bar" :style="{ height: headerHeight, paddingTop: statusBarHeight + 'px' }">
      <view class="left-section">
        <view class="back-button" @click="goBack">
          <uni-icons type="left" size="24" color="#333"></uni-icons>
        </view>
      </view>
      <view class="center-section">
        <text class="question-counter" style="padding-left: 70rpx;" v-if="!loading">
          <text class="current-question-number">{{ examStore.currentQuestionIndex + 1 }}</text>
          / {{ examStore.totalQuestions }}
        </text>
      </view>
      <view class="right-section">
        <uni-icons v-if="!loading" :type="examStore.favoritedQuestionIds.has(examStore.currentQuestion.id) ? 'star-filled' : 'star'" size="24" :color="examStore.favoritedQuestionIds.has(examStore.currentQuestion.id) ? '#ffb300' : '#333'" class="header-icon" @click="examStore.toggleFavorite(examStore.currentQuestion.id)"></uni-icons>
        <image
            v-if="!loading"
            src="/static/images/datika.png"
            class="header-icon datika-icon"
            @click="examStore.toggleQuestionCard"
            mode="widthFix"
        />
      </view> <!-- 右侧部分包含收藏和答题卡图标 -->
    </view>
    <view v-if="loading" class="loading-state">
      <uni-icons type="spinner-cycle" size="40" color="#007aff" class="loading-icon"></uni-icons>
      <text class="loading-text">正在加载试题...</text>
    </view>
    <view v-else class="question-content-wrapper" :style="{ marginTop: headerHeight }">
        <!-- 将试卷名称放在这里，在返回按钮下方 -->
        <!-- 添加 ref 引用 -->
        <!-- 
        <view class="content-header" ref="contentHeaderRef">
            <view class="content-header-row">
                <text class="paper-title-in-content">{{ examStore.paperTitle }}</text>
            </view>
            <view class="content-header-divider"></view>
        </view>
        -->

        <!-- Use transition component for non-mini-program platforms -->
        <!-- For mini-program, we'll use native animation -->
        <swiper
          class="questions-swiper"
          :style="{ height: swiperHeight }"
          :current="currentIndex"
          @change="onSwiperChange"
          :duration="300"
        >
          <swiper-item
            v-for="(question, qIndex) in questions"
            :key="question.id || qIndex"
            class="swiper-item"
          >
            <scroll-view class="question-scroll" scroll-y="true" style="height: 100%; width: 100%;">
              <view class="question-main">
                <!-- 题目分值 -->
                <view class="question-score-info" v-if="question.score">
                    <text class="score-label left">本题分值：{{ question.score }}分</text>
                </view>
                <!-- 题干 -->
                <view class="question-stem-content">
                     <template v-for="(segment, index) in question.textSegments" :key="index">
                         <view v-if="segment.type === 'text'" class="question-text-segment" v-html="segment.content"></view>
                         <MathJax v-else-if="segment.type === 'formula'" :formula="segment.content" :displayMode="segment.displayMode"></MathJax>
                         <image v-else-if="segment.type === 'image'" :src="segment.url" mode="widthFix" class="question-content-image" @click="previewImage(segment.url)"></image>
                         <text v-else-if="segment.type === 'multipleChoicePrefix'" class="multiple-choice-prefix">{{ segment.content }}</text>
                     </template>
                </view>
                <image v-if="question.image" :src="question.image" mode="widthFix" class="question-image" @click="previewImage(question.image)"></image>
                <!-- 答案区域 -->
                <view class="answer-area">
                    <template v-if="question.type === 'choice'">
                        <template v-if="question && question.options && question.options.length > 0">
                            <view 
                                class="choice-item" 
                                v-for="(option, optionIndex) in question.options" 
                                :key="optionIndex"
                                @click="examStore.selectOption(question.id, option.value)"
                                :class="{'selected': question.selectedAnswers && question.selectedAnswers.includes(option.value)}"
                                >
                                <text class="option-label">{{ option.label }}</text>
                                 <view class="option-text-content">
                                     <template v-for="(segment, segmentIndex) in option.segments" :key="segmentIndex">
                                         <view v-if="segment.type === 'text'" class="option-text-segment" v-html="segment.content"></view>
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
                    <template v-else-if="question.type === 'fill' || question.type === 'application'">
                        <!-- 填空题和解答题的拍照上传功能 -->
                        <view class="upload-section">
                            <view class="upload-header">
                                <text class="upload-title">拍照上传答案</text>
                                <text class="upload-tip">最多上传3张图片</text>
                            </view>
                            <view class="image-preview-list" v-if="examStore.uploadedImages[question.id] && examStore.uploadedImages[question.id].length > 0">
                                <view 
                                    class="image-preview-item" 
                                    v-for="(image, index) in examStore.uploadedImages[question.id]" 
                                    :key="index"
                                >
                                    <image 
                                        :src="`data:image/jpeg;base64,${image.base64}`" 
                                        mode="aspectFill" 
                                        class="preview-image"
                                        @click="previewImage(`data:image/jpeg;base64,${image.base64}`)"
                                    ></image>
                                    <view class="image-actions">
                                        <view class="delete-btn" @click.stop="deleteImage(index, question.id)">
                                            <uni-icons type="trash" size="20" color="#ff4d4f"></uni-icons>
                                        </view>
                                    </view>
                                </view>
                            </view>
                            <view 
                                class="upload-btn" 
                                v-if="!examStore.uploadedImages[question.id] || examStore.uploadedImages[question.id].length < 3"
                                @click.stop="chooseAndUploadImage(question.id)"
                            >
                                <uni-icons type="camera" size="24" color="#007aff"></uni-icons>
                                <text>拍照上传</text>
                            </view>
                        </view>
                    </template>
                </view>
              </view>
            </scroll-view>
          </swiper-item>
        </swiper>
      </view>

      <!-- 导航按钮 -->
      <view class="navigation-buttons">
        <view class="dual-button-container">
          <button class="nav-button prev-button" @click="currentIndex > 0 && (currentIndex--, examStore.currentQuestionIndex = currentIndex)">上一题</button>
          <button class="nav-button next-button" @click="currentIndex < questions.length - 1 && (currentIndex++, examStore.currentQuestionIndex = currentIndex)">下一题</button>
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
                 @click="goToQuestion(question.index)"
                 >
                {{ question.number }}
              </view>
            </view>
          </view>
        </scroll-view>
        <view class="card-footer">
          <button class="submit-button" @click="handleSubmit">交卷并查看结果</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
// uni-icons will be automatically imported via easycom
import { onLoad } from '@dcloudio/uni-app';
import { getQuestionList, getImagePreSignedUrls } from '@/api/exam'; // Import the API functions
import { processImagesWithBatchAPI } from '@/utils/imageUtils';
import MathJax from '@/components/MathJax.vue'; // Import the MathJax component
import { useExamStore } from '@/stores/exam';

// 获取考试 store
const examStore = useExamStore();
const questions = computed(() => examStore.questions);
const currentIndex = ref(0);
const loading = ref(true);

// swiper 切换事件
const onSwiperChange = (e) => {
  currentIndex.value = e.detail.current;
  examStore.currentQuestionIndex = currentIndex.value;
};

// 答题卡切题
const goToQuestion = (index) => {
  if (index >= 0 && index < questions.value.length) {
    currentIndex.value = index;
    examStore.currentQuestionIndex = index;
    examStore.showQuestionCard = false;
  }
};

// 新增 pushId 状态
const currentPushId = ref(null);

// 头部高度相关
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

// content-header高度
const contentHeaderRef = ref(null);
const contentHeaderHeight = ref(0); // 改为0，因为不再显示content-header
// 不再需要获取content-header高度的函数
// const getContentHeaderHeight = () => {
//   nextTick(() => {
//     setTimeout(() => {
//       uni.createSelectorQuery().select('.content-header').boundingClientRect(rect => {
//         if (rect && rect.height) {
//           contentHeaderHeight.value = rect.height;
//         } else {
//           contentHeaderHeight.value = 60;
//         }
//       }).exec();
//     }, 200);
//   });
// };

const swiperHeight = computed(() => {
  // 120px为底部按钮区高度
  return `calc(100vh - ${headerHeight.value} - 120px)`;
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





// 返回上一页
const goBack = () => {
  examStore.stopTimer();
  
  // 尝试获取当前页面路由信息
  const pages = getCurrentPages();
  
  // 如果页面栈长度为1，表示当前页面是唯一页面（可能是刷新导致）
  // 此时需要重新跳转到 intro 页面而不是用 navigateBack
  if (pages.length <= 1) {
    // 从当前 URL 获取参数
    const currentPage = pages[0];
    const pageSourceId = currentPage.options?.sourceId;
    const pagePushId = currentPage.options?.pushId;
    
    // 构造返回到 intro 页面的 URL
    let url = `/pages/exam/intro/index?sourceId=${pageSourceId}`;
    if (pagePushId) {
      url += `&pushId=${pagePushId}`;
    }
    
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

// 选择并上传图片
const chooseAndUploadImage = async (questionId) => {
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

// New computed property to gather all image URLs for preview in answering page
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

    // Add student uploaded images (base64 converted to data URL for preview)
    if (examStore.currentQuestionImages && examStore.currentQuestionImages.length > 0) {
        examStore.currentQuestionImages.forEach(image => {
            // For local base64 images, create a data URL for preview
            urls.push(`data:image/jpeg;base64,${image.base64}`);
        });
    }
    
    // Remove duplicates and ensure unique URLs
    return [...new Set(urls)];
});

// 预览图片
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

// 删除图片
const deleteImage = (index, questionId) => {
    uni.showModal({
        title: '确认删除',
        content: '确定要删除这张图片吗？',
        success: (res) => {
            if (res.confirm) {
                examStore.removeImage(questionId, index);
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

// 处理提交按钮点击
const handleSubmit = () => {
  examStore.submitExam();
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

  // 不再需要获取content-header的高度
  // getContentHeaderHeight();

  // 初始化小程序动画实例
  initMPAnimation();
});

onUnmounted(() => {
  examStore.stopTimer();
});

onLoad(async (options) => {
  examStore.currentQuestionIndex = 0; // 每次进入页面都重置为第一题
  currentIndex.value = 0; // 同时也重置swiper的当前索引
  console.log('answering: Page onLoad', options);
  loading.value = true;
  
  // 重置状态，确保不会显示上一个试卷的数据
  examStore.questions = [];
  examStore.resetUploadedImages();
  examStore.paperTitle = '';
  
  if (options && options.sourceId) {
    const sourceId = options.sourceId;
    currentPushId.value = options.pushId || null; // 获取 pushId
    // 新增：处理试卷名称
    if (options.paperName) {
      examStore.paperTitle = decodeURIComponent(options.paperName);
    }
    console.log('answering: Received sourceId from options:', sourceId);
    console.log('answering: Received pushId from options:', currentPushId.value); // 打印 pushId
    
    // 添加错误处理
    try {
      // loadQuestions 会更新 examStore.questions，从而触发 watch 监听
      await examStore.loadQuestions(sourceId, currentPushId.value);
    } catch (error) {
      console.error('加载题目失败:', error);
      uni.showToast({
        title: '加载题目失败',
        icon: 'none'
      });
    }
  } else {
    console.warn('answering: No sourceId received from options.');
    uni.showToast({
      title: '未获取到试卷ID',
      icon: 'none'
    });
  }
  loading.value = false;
});

// Add a watcher to see when questions in the store changes
watch(() => examStore.questions, (newValue) => {
    console.log('answering: examStore.questions changed. Total questions:', newValue.length);
    // When questions load, reset current question index to 0 to show the first question
    if (newValue && newValue.length > 0) {
        currentIndex.value = examStore.currentQuestionIndex;
        // 不再需要计算content-header的高度
        // getContentHeaderHeight();
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
  height: 100vh;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 0;
  box-sizing: border-box;
  background: linear-gradient(135deg, #f8f8ff 0%, #e0e7ff 100%);
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
    width: 80rpx; /* 稍微增加宽度 */
    margin-left: 10rpx;
}

.center-section {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  flex: 1; /* 占用剩余空间 */
  // padding-left: 70rpx; /* 向右偏移 */
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

/* 题目内容区域容器 */
.question-content-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  margin-top: 0; /* 将由:style="{ marginTop: headerHeight }"动态设置 */
  padding-top: 10rpx; /* 增加一点内边距，使内容看起来更舒适 */
  padding-bottom: 0;
  position: relative;
  overflow: hidden;
}

/* 内容头部（包含试卷名称和图标行）*/
.content-header {
    margin-bottom: 40rpx; /* Increase margin-bottom to push content down */
    padding: 0 20rpx;
    /* Ensure it takes up space and clears potential floats */
    display: block; /* Use block display */
    width: 100%;
}

.content-header-row {
  margin-top: 30rpx;
  display: flex;
  align-items: center;
  width: 100%;
}

.paper-title-in-content {
  flex: 1;
  min-width: 0;
  font-size: 38rpx;
  font-weight: bold;
  color: #333;
  text-align: left;
  margin-bottom: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

// 移除 .content-header-icons 样式类

.question-counter {
    font-size: 28rpx;
    color: #555;
    display: flex;
    align-items: center;
    justify-content: center;
}

.current-question-number {
  color: #007aff;
  font-weight: bold;
  font-size: 32rpx;
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

.questions-swiper, .swiper-item, .question-scroll {
  height: 100%;
  width: 100%;
}
.question-main {
  height: 100%;
  width: 100%;
  box-sizing: border-box;
  padding: 20rpx;
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
  flex-shrink: 0;
  flex-grow: 0;
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
  z-index: 900;
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

/* For now, let's try to ensure text and inline formulas align well */
.question-stem-content text,
.option-text-content text {
  vertical-align: middle;
  font-size: 34rpx; /* Reset font size for question stem text */
}

.multiple-choice-prefix {
  color: #ff5722; /* Choose a distinct color, e.g., orange-red */
  font-weight: bold;
  margin-right: 10rpx;
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

/* New styles for text segments that might contain HTML */
.question-text-segment,
.option-text-segment {
  display: inline-block; /* To allow alignment with MathJax/other inline elements */
  vertical-align: middle; /* Try to maintain alignment */
  font-size: 34rpx; /* Default font size for question stem text */
  color: #333;
  line-height: 1.6;
  word-break: break-word;
}

/* Remove the old text styles that are now handled by .question-text-segment/.option-text-segment */
.question-stem-content text,
.option-text-content text {
  /* No longer needed as they are now views with v-html */
  /* These rules will be overridden or become redundant */
  font-size: initial; /* Reset to initial or remove entirely */
  vertical-align: initial;
}

/* Styles for images rendered via <image> component */
.question-content-image,
.option-content-image {
  max-width: 40%; /* Set max-width to 40% */
  height: auto; /* Maintain aspect ratio */
  display: block; /* Make it a block element */
  margin: 10rpx auto; /* Center image and add vertical margin */
  border-radius: 8rpx; /* Optional: add some border radius */
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

/* 新增题目分值样式 */
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

.question-score-info text {
  /* 确保每个文本元素内部内容不换行，如果需要 */
  white-space: nowrap;
}

/* 移除旧的题目分值样式 */
/*
.question-score {
  font-size: 28rpx;
  color: #666;
  margin-bottom: 20rpx;
  text-align: left;
  font-weight: bold;
}
*/

/* datika 答题卡图标样式 */
.datika-icon {
  width: 22px;
  height: 22px;
  display: inline-block;
  vertical-align: middle;
  cursor: pointer;
}

/* 加载状态样式 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  position: absolute;
  top: 0;
  left: 0;
  background-color: rgba(255, 255, 255, 0.8);
  z-index: 1000;
}

.loading-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  margin-top: 20rpx;
  font-size: 32rpx;
  color: #666;
}

.content-header-divider {
  width: 100%;
  height: 1px;
  background: #e5e6eb;
  margin-top: 16rpx;
  margin-bottom: 0;
  border: none;
}
</style> 