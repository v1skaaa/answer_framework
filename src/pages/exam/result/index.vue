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
      <view class="paper-title">试卷：{{ paperTitle }}</view>
      <view class="score-section">
        <view class="score-circle">
          <text class="score">{{ score }}</text>
          <text class="total-score">/{{ totalScore }}</text>
        </view>
        <text class="score-label">得分</text>
      </view>
      <view class="time-spent">耗时：{{ timeSpent }}min</view>
    </view>

    <!-- Question Status Overview -->
    <scroll-view class="question-status-area" scroll-y>
      <view class="question-type-section" v-for="(type, typeIndex) in questionTypes" :key="typeIndex">
        <text class="type-title">{{ type.name }} (共{{ type.count }}题)</text>
        <view class="question-number-list">
          <view
            class="question-number-item"
            v-for="(question, qIndex) in type.questions"
            :key="qIndex"
            :class="{'correct': question.status === 'correct', 'incorrect': question.status === 'incorrect', 'unanswered': question.status === 'unanswered'}"
             @click="goToQuestionAnalysis(question.originalIndex)"
          >
            {{ question.number }}
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- Analysis Button -->
    <view class="analysis-button-container">
        <button class="analysis-button" @click="viewAnalysis">题目解析</button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
// uni-icons will be automatically imported via easycom

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

// Virtual Data (Replace with actual data from previous page)
const paperTitle = ref('模拟试卷 XXX');
const score = ref(7);
const totalScore = ref(100);
const timeSpent = ref(71);

// Example Data Structure for questionTypes (Based on the answer card structure)
const questionTypes = ref([]);

// Map status to visual style
// correct: green
// incorrect: red
// unanswered: white (default/original)

// Function to process data received from the previous page
const processResultData = (data) => {
  console.log('Received data:', data);
  if (!data || !data.userAnswer || !data.questions) {
      console.error('Invalid data received for result page');
      // Load mock data if no data is received
      loadMockData();
      return;
  }

  paperTitle.value = data.paperTitle || '试卷名称';
  totalScore.value = data.totalScore || 100; // Assuming total score is passed or calculated
  timeSpent.value = Math.floor((Date.now() - data.startTime) / 60000); // Calculate time spent in minutes

  // --- Calculate Score and Question Status ---
  let calculatedScore = 0;
  const processedQuestionTypes = {};

  data.questions.forEach((q, index) => {
      const userAnswer = data.userAnswer.find(ua => ua.id === q.id);
      let status = 'unanswered'; // Default status

      if (userAnswer && userAnswer.selectedAnswer) {
          // Assuming q.correctAnswer exists in the original questions data
          if (q.type === 'choice') { // Only score choice questions for simplicity in mock data
              if (userAnswer.selectedAnswer === q.correctAnswer) {
                  status = 'correct';
                  calculatedScore += q.score || 5; // Assuming a score for each question
              } else {
                  status = 'incorrect';
              }
          } else { // For fill and text questions, just mark as answered if there is an answer
               status = 'answered'; // Use answered status for non-choice if any answer is present
          }
      }

      // Structure for displaying in the result page
      const questionResult = {
          number: q.number,
          originalIndex: index, // Store original index for navigation
          status: status,
          answered: !!(userAnswer && userAnswer.selectedAnswer) // For display similar to answer card
      };

      if (!processedQuestionTypes[q.type]) {
          processedQuestionTypes[q.type] = { name: q.type === 'choice' ? '选择题' : q.type === 'fill' ? '填空题' : '解答题', count: 0, questions: [] };
      }
      processedQuestionTypes[q.type].count++;
      processedQuestionTypes[q.type].questions.push(questionResult);
  });

  score.value = calculatedScore;

  // Convert object to array and order
    const orderedTypes = [];
    if (processedQuestionTypes['choice']) orderedTypes.push(processedQuestionTypes['choice']);
    if (processedQuestionTypes['fill']) orderedTypes.push(processedQuestionTypes['fill']);
    if (processedQuestionTypes['text']) orderedTypes.push(processedQuestionTypes['text']);
    // Add any other types
    for (const typeKey in processedQuestionTypes) {
        if (!['choice', 'fill', 'text'].includes(typeKey)) {
            orderedTypes.push(processedQuestionTypes[typeKey]);
        }
    }
    questionTypes.value = orderedTypes;

};

// Mock Data Load (for testing if no data is passed)
const loadMockData = () => {
    paperTitle.value = '模拟试卷（无数据）';
    score.value = 10;
    totalScore.value = 150;
    timeSpent.value = 0;
    questionTypes.value = [
        { name: '选择题', count: 9, questions: [
            { number: 1, originalIndex: 0, status: 'correct' },
            { number: 2, originalIndex: 1, status: 'incorrect' },
            { number: 3, originalIndex: 2, status: 'unanswered' },
            { number: 4, originalIndex: 3, status: 'correct' },
            { number: 5, originalIndex: 4, status: 'incorrect' },
            { number: 6, originalIndex: 5, status: 'correct' },
            { number: 7, originalIndex: 6, status: 'unanswered' },
            { number: 8, originalIndex: 7, status: 'incorrect' },
            { number: 9, originalIndex: 8, status: 'correct' },
        ]},
         { name: '填空题', count: 6, questions: [
            { number: 10, originalIndex: 9, status: 'answered' },
            { number: 11, originalIndex: 10, status: 'unanswered' },
            { number: 12, originalIndex: 11, status: 'answered' },
            { number: 13, originalIndex: 12, status: 'unanswered' },
            { number: 14, originalIndex: 13, status: 'answered' },
            { number: 15, originalIndex: 14, status: 'unanswered' },
        ]},
         { name: '解答题', count: 5, questions: [
            { number: 16, originalIndex: 15, status: 'answered' },
            { number: 17, originalIndex: 16, status: 'unanswered' },
            { number: 18, originalIndex: 17, status: 'answered' },
            { number: 19, originalIndex: 18, status: 'unanswered' },
            { number: 20, originalIndex: 19, status: 'answered' },
        ]},
    ];
};


// Go back to previous page
const goBack = () => {
  uni.navigateBack();
};

// Navigate to question analysis (Placeholder)
const goToQuestionAnalysis = (index) => {
  console.log('Go to analysis for question index:', index);
  // TODO: Implement navigation to analysis page/section
};

// View full analysis (Placeholder)
const viewAnalysis = () => {
  console.log('View full analysis clicked');
   // TODO: Implement full analysis view or section
};

// Receive data when page is loaded
onLoad((options) => {
    // For uni-app using event channel via options.eventChannel
    if (options.eventChannel) {
      options.eventChannel.once('acceptResultData', (data) => {
        processResultData(data);
      });
    } else {
      console.warn('No eventChannel received, loading mock data or handling appropriately.');
      // Depending on your app flow, you might want to load mock data or show an error
      loadMockData();
    }

    // If using URL parameters (less ideal for complex objects)
    // if(options.data) {
    //     try {
    //         const data = JSON.parse(decodeURIComponent(options.data));
    //         processResultData(data);
    //     } catch (e) {
    //         console.error('Failed to parse URL data', e);
    //         loadMockData(); // Load mock data on error
    //     }
    // } else {
    //     loadMockData(); // Load mock data if no data is passed via URL
    // }

     // If no data is received after a short delay, load mock data
     setTimeout(() => {
        if (questionTypes.value.length === 0) {
            console.warn('No result data received, loading mock data.');
            loadMockData();
        }
    }, 1000); // Adjust delay as needed
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
.analysis-button-container {
    padding: 20rpx;
    border-top: 1rpx solid #eee; /* Optional separator */
}

.analysis-button {
  background-color: #007aff; /* Example button color */
  color: #fff;
  font-size: 32rpx;
  padding: 15rpx 0;
  border-radius: 50rpx;
  text-align: center;
  cursor: pointer;
}
</style> 