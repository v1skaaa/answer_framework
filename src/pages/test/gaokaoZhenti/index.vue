<template>
  <view class="gaokao-zhenti-container" :style="{ paddingTop: containerPaddingTop }">
    <view class="header-bar" :style="{ height: headerHeight, paddingTop: statusBarHeight + 'px' }">
      <view class="back-button" @click="goBack">
        <uni-icons type="left" size="24" color="#333"></uni-icons>
      </view>
      <view class="page-title">高考真题</view>
      <view class="placeholder"></view>
    </view>
    <view class="paper-list">
      <view class="paper-item" v-for="(item, index) in paperList" :key="index" @click="goToPaperDetail(item)">
        <view class="paper-info">
          <text class="paper-title">{{ item.year }}年普通高等学校招生全国统一考试</text>
          <text class="paper-subtitle">({{ item.context }}) : {{ item.subject }}</text>
          <text class="paper-questions">共{{ item.questions }}道题</text>
        </view>
        <view class="paper-status">
          <text :class="['status-button', 'status-' + item.status]">{{ item.statusText }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
// uni-icons will be automatically imported via easycom
 
// 获取胶囊按钮位置信息
const menuButtonHeight = ref(0);
const menuButtonTop = ref(0);
const navBarHeight = ref(0);
const systemInfo = uni.getSystemInfoSync();
const statusBarHeight = systemInfo.statusBarHeight;

// 计算头部总高度
const headerHeight = computed(() => {
  // #ifdef MP-WEIXIN
  return menuButtonTop.value + menuButtonHeight.value + 'px'; // 小程序端：胶囊顶部到屏幕顶部的距离 + 胶囊高度
  // #endif
  // #ifdef H5
  return (statusBarHeight + 44) + 'px'; // H5端：状态栏高度 + 标准导航栏高度44px
  // #endif
  return '0px'; // Default
});

// 计算内容区域的顶部内边距，增加额外空间
const containerPaddingTop = computed(() => {
    const extraSpace = 20; // 额外增加的像素值
   // #ifdef MP-WEIXIN
  return menuButtonTop.value + menuButtonHeight.value + extraSpace + 'px'; // 小程序端：头部高度 + 额外空间
  // #endif
  // #ifdef H5
  return (statusBarHeight + 44 + extraSpace) + 'px'; // H5端：头部高度 + 额外空间
  // #endif
  return '0px'; // Default
});


onMounted(() => {
  // #ifdef MP-WEIXIN
  const menuButtonInfo = uni.getMenuButtonBoundingClientRect();
  menuButtonHeight.value = menuButtonInfo.height;
  menuButtonTop.value = menuButtonInfo.top;
  navBarHeight.value = statusBarHeight + menuButtonInfo.height + 8;
  // #endif
});

// 模拟试卷数据
const paperList = ref([
  {
    id: 1,
    year: 2022,
    context: '上海卷',
    subject: '数学',
    questions: 21,
    status: 'not-finished',
    statusText: '未完成'
  },
  {
    id: 2,
    year: 2023,
    context: '北京卷',
    subject: '数学',
    questions: 21,
    status: 'not-started',
    statusText: '未做'
  },
  {
    id: 3,
    year: 2023,
    context: '北京卷',
    subject: '数学',
    questions: 21,
    status: 'finished',
    statusText: '已完成'
  }
]);

// Filter options
// ... existing code ...

// Selected filters
// ... existing code ...

// Filtered list based on selections
const filteredPaperList = computed(() => {
  return paperList.value;
});

// 跳转到试卷详情页（待实现）
const goToPaperDetail = (item) => {
  console.log('Navigate to paper detail for:', item.title);
  // TODO: Implement actual navigation to paper detail page
  // uni.navigateTo({ url: `/pages/test/paperDetail?id=${item.id}` });
};

// Method to go back to the previous page
const goBack = () => {
  uni.navigateBack();
};
</script>

<style lang="scss">
.gaokao-zhenti-container {
  padding: 0 20rpx 20rpx 20rpx;
  /* Remove fixed padding-top and apply via :style */
  background: linear-gradient(135deg, #f8f8ff 0%, #e0e7ff 100%);
  min-height: 100vh;
  box-sizing: border-box;
}

.status-bar-and-header-placeholder {
    height: calc(var(--status-bar-height) + 88rpx); /* Status bar + standard nav bar height */
    background-color: #f8f8f8; /* White background */
    width: 100%;
}

.header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20rpx; /* Adjust horizontal padding */
  width: 100%;
  box-sizing: border-box;
  background: linear-gradient(135deg, #f8f8ff 0%, #e0e7ff 100%);
  /* Remove margin-top and dynamic height/padding-top */
  margin-top: 0; /* Should be 0 for fixed positioning */

  position: fixed; /* Fixed at the top */
  top: 0;
  left: 0;
  right: 0;
  z-index: 100; /* Ensure it's above other content */
}

.back-button,
.page-title,
.placeholder {
    display: flex;
    align-items: center;
    justify-content: center; /* Horizontally center for title */
     height: 100%; /* Take full height of header-bar */
}

.back-button,
.placeholder {
    width: 60rpx;
    cursor: pointer;
}

.page-title {
  font-size: 36rpx;
  font-weight: bold;
  flex: 1;
  text-align: center; /* Keep text-align for broader compatibility */
  margin: 0;
  color: #333;
}

.paper-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx; // Space between paper items
  /* Ensure no margin-top is applied here */
}

.paper-item {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;

  &:active {
    transform: scale(0.98);
    box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.1);
  }
}

.paper-info {
  flex: 1;
  margin-right: 20rpx;

  .paper-title {
    font-size: 28rpx;
    font-weight: bold;
    color: #333;
    display: block;
    margin-bottom: 8rpx;
  }

  .paper-subtitle {
    font-size: 24rpx;
    color: #666;
    display: block;
    margin-bottom: 4rpx;
  }

  .paper-questions {
    font-size: 24rpx;
    color: #888;
  }
}

.paper-status {
  .status-button {
    font-size: 24rpx;
    padding: 8rpx 16rpx;
    border-radius: 12rpx;
    
    &.status-not-finished {
      background-color: #ffecb3; /* Light orange */
      color: #ff9800; /* Orange */
    }

    &.status-not-started {
      background-color: #e0e0e0; /* Light gray */
      color: #757575; /* Gray */
    }

    &.status-finished {
      background-color: #c8e6c9; /* Light green */
      color: #4caf50; /* Green */
    }
  }
}

.no-data {
    text-align: center;
    color: #999;
    margin-top: 40rpx;
}
</style> 