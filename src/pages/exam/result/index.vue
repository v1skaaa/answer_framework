<template>
  <view class="exam-result-container" :style="{ paddingTop: containerPaddingTop }">
    <!-- Custom Header -->
    <view class="header-bar" :style="{ height: headerHeight, paddingTop: statusBarHeight + 'px' }">
      <view class="left-section">
        <view class="back-button" @click="goBack">
          <uni-icons type="left" size="24" color="#333"></uni-icons>
        </view>
      </view>
      <view class="title">结果详情</view>
      <view class="right-section"></view> <!-- Right placeholder -->
    </view>

    <!-- Result Summary -->
    <view class="result-summary">
      <view class="paper-title">试卷：{{ examStore.paperTitle }}</view>
      <view class="score-section">
        <view class="score-circle">
          <text class="score">{{ examStore.score }}</text>
          <text class="total-score">/{{ examStore.totalScore }}</text>
        </view>
        <text class="score-label">得分</text>
      </view>
      <view class="time-spent">耗时：{{ examStore.timeSpent }}min</view>
    </view>

    <!-- Question Status Overview -->
    <scroll-view class="question-status-area" scroll-y>
      <view class="question-type-section" v-for="(type, typeIndex) in examStore.resultQuestionSummary" :key="typeIndex">
        <text class="type-title">{{ type.name }} (共{{ type.count }}题)</text>
        <view class="question-number-list">
          <view
            class="question-number-item"
            v-for="(question, qIndex) in type.questions"
            :key="qIndex"
            :class="{'correct': question.status === 'correct', 'incorrect': question.status === 'incorrect', 'unanswered': question.status === 'unanswered', 'answered': question.status === 'answered'}"
             @click="goToQuestionAnalysis(question.originalIndex)"
          >
            {{ question.number }}
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- Analysis Button -->
    <view class="navigation-buttons">
        <view class="dual-button-container">
            <button class="nav-button prev-button" @click="goToHome">
                返回主界面
            </button>
            <button class="nav-button next-button" @click="viewAnalysis">
                题目解析
            </button>
        </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useExamStore } from '@/stores/exam';
// uni-icons will be automatically imported via easycom

// 获取考试 store
const examStore = useExamStore();

// 存储 recordId
const currentRecordId = ref(null);

// 获取胶囊按钮位置信息和状态栏高度
const menuButtonHeight = ref(0);
const menuButtonTop = ref(0);
// #ifdef MP-WEIXIN
const systemInfo = wx.getWindowInfo();
const statusBarHeight = systemInfo.statusBarHeight;
// #endif
// #ifdef H5 || APP-VUE || MP-ALIPAY || MP-BAIDU || MP-TOUTIAO || MP-QQ
// 对于非微信小程序，可以尝试获取系统信息或使用固定值
const systemInfo = uni.getSystemInfoSync();
const statusBarHeight = systemInfo.statusBarHeight;
// 如果是非小程序且没有胶囊按钮，可以给 menuButtonTop 和 menuButtonHeight 设置默认值
menuButtonHeight.value = systemInfo.statusBarHeight ? 32 : 0; // 假设一个常见的高度
menuButtonTop.value = systemInfo.statusBarHeight ? systemInfo.statusBarHeight + 6 : 0; // 假设一个常见的顶部偏移
// #endif
// #ifndef MP-WEIXIN || H5 || APP-VUE || MP-ALIPAY || MP-BAIDU || MP-TOUTIAO || MP-QQ
// 其他未知平台，可以设置默认值
const statusBarHeight = 0;
// #endif

// 计算头部总高度
const headerHeight = computed(() => {
  // #ifdef MP-WEIXIN
  return menuButtonTop.value + menuButtonHeight.value + 'px';
  // #endif
  // #ifdef H5 || APP-VUE || MP-ALIPAY || MP-BAIDU || MP-TOUTIAO || MP-QQ
  // 对于非微信小程序，使用状态栏高度加上一个标准导航栏高度
  return (statusBarHeight + 44) + 'px';
  // #endif
  return '0px'; // Default
});

// 计算内容区域的顶部内边距 (考虑头部高度)
const containerPaddingTop = computed(() => {
   // #ifdef MP-WEIXIN
  return menuButtonTop.value + menuButtonHeight.value + 'px';
  // #endif
  // #ifdef H5 || APP-VUE || MP-ALIPAY || MP-BAIDU || MP-TOUTIAO || MP-QQ
  // 对于非微信小程序，使用状态栏高度加上一个标准导航栏高度
  return (statusBarHeight + 44) + 'px';
  // #endif
  return '0px'; // Default
});

// Go back to previous page
const goBack = () => {
  uni.navigateBack();
};

// Navigate to question analysis (Placeholder)
const goToQuestionAnalysis = (index) => {
  console.log('Go to analysis for question index:', index);
  // TODO: Implement navigation to analysis page/section
  
  // 获取被点击题目的ID
  // const questionId = examStore.questions[index]?.id;
  
  if (currentRecordId.value) {
      uni.navigateTo({
          url: `/pages/exam/analysis/index?recordId=${currentRecordId.value}`
      });
  } else {
      console.error('无法跳转到题目解析：缺少 recordId');
      uni.showToast({
          title: '无法查看解析',
          icon: 'none'
      });
  }
};

// View full analysis (Placeholder)
const viewAnalysis = () => {
  console.log('View full analysis clicked');
   // TODO: Implement full analysis view or section
   
   // 默认跳转到第一个题目的解析
   // const firstQuestionId = examStore.questions[0]?.id;

   if (currentRecordId.value) {
       uni.navigateTo({
           url: `/pages/exam/analysis/index?recordId=${currentRecordId.value}`
       });
   } else {
       console.error('无法跳转到题目解析：缺少 recordId');
       uni.showToast({
           title: '无法查看解析',
           icon: 'none'
       });
   }
};

// Navigate to home page
const goToHome = () => {
  uni.reLaunch({
    url: '/pages/index/index'
  });
};

// Receive data when page is loaded
onLoad((options) => {
    console.log('result: Page onLoad', options);
    if (options && options.recordId) {
        const recordId = options.recordId;
        currentRecordId.value = recordId; // 存储 recordId
        console.log('result: Received recordId from options:', recordId);
        examStore.loadExamDetails(recordId);
    } else {
        console.warn('result: No recordId received from options, loading mock data.');
        examStore.loadMockDataForResult(); // Load mock data if no recordId
    }
});

</script>

<style lang="scss">
/* 页面容器 */
.exam-result-container {
  /* Adjust padding top dynamically */
  padding: 0 20rpx 20rpx 20rpx; /* Keep horizontal and bottom padding */
  background: linear-gradient(135deg, #f8f8ff 0%, #e0e7ff 100%);
  min-height: 100vh;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  /* padding-top is applied via :style */
}

/* Header */
.header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20rpx;
  width: 100%;
  box-sizing: border-box;
  background: linear-gradient(135deg, #f8f8ff 0%, #e0e7ff 100%);
  margin-top: 0; /* Should be 0 for fixed positioning */

  position: fixed; /* Fixed at the top */
  top: 0;
  left: 0;
  right: 0;
  z-index: 100; /* Ensure it's above other content */
  /* height and padding-top are applied via :style */
}

.left-section {
  width: 60rpx;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%; /* Take full height of header-bar */
}

.title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}

.right-section {
  width: 60rpx; /* Right placeholder width */
  display: flex; /* Ensure alignment */
  align-items: center;
  height: 100%; /* Take full height of header-bar */
}

.back-button {
  width: 60rpx;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  height: 100%; /* Take full height of left-section */
}

/* Result Summary */
.result-summary {
  text-align: center;
  margin-bottom: 40rpx;
}

.paper-title {
  font-size: 32rpx;
  color: #555;
  margin-bottom: 20rpx;
}

.score-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20rpx;
}

.score-circle {
  width: 180rpx;
  height: 180rpx;
  border: 6rpx solid #007aff; /* Example border color */
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin-bottom: 10rpx;
}

.score {
  font-size: 64rpx;
  font-weight: bold;
  color: #007aff; /* Example score color */
}

.total-score {
  font-size: 32rpx;
  color: #555;
}

.score-label {
    font-size: 28rpx;
    color: #555;
}

.time-spent {
  font-size: 28rpx;
  color: #555;
}

/* Question Status Area */
.question-status-area {
    flex: 1; /* Allow scroll view to take available space */
    padding-right: 10rpx; /* Add some padding for scrollbar */
    box-sizing: border-box;
    padding-bottom: 160rpx; /* Add sufficient padding to the scroll-view */
}

.question-type-section {
  margin-bottom: 30rpx;
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
  gap: 55rpx; /* Increased gap for more space between items */
}

.question-number-item {
  /* Ensure correct circular shape with border, 5 per row layout, and centered text */
  /* Adjust width calculation for smaller circles while maintaining 5 per row and 20rpx gap */
  width: calc((100% - 4 * 60rpx) / 5); /* Further increase calculated gap for smaller item width */
  /* Use aspect-ratio to ensure perfect circle */
  height: auto; /* Allow height to be determined by aspect-ratio */
  aspect-ratio: 1; /* Force 1:1 aspect ratio for perfect circle */
  border-radius: 50%; /* Make it circular */
  box-sizing: border-box; /* Include padding/border in size */
  
  display: flex; /* Use flexbox for centering content */
  justify-content: center; /* Center horizontally */
  align-items: center; /* Center vertically */
  
  font-size: 28rpx; /* Base font size for numbers */
  cursor: pointer;
  
  /* Default border, background, and text color for unanswered state */
  border: 1rpx solid #ccc;
  background-color: #fff;
  color: #555; 
}

/* Status specific overrides */
.question-number-item.correct {
  background-color: #4CAF50; /* Green */
  border-color: #4CAF50; /* Green border */
  color: #fff; /* White text */
}

.question-number-item.incorrect {
  background-color: #F44336; /* Red */
  border-color: #F44336; /* Red border */
  color: #fff; /* White text */
}

.question-number-item.answered {
  /* Style for fill/text questions that are answered */
  background-color: #007aff; /* Blue */
  border-color: #007aff; /* Blue border */
  color: #fff; /* White text */
}

/* .unanswered status uses the default style */

/* Analysis Button */
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
</style> 