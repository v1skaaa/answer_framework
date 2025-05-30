<template>
  <view class="container">
    <!-- 自定义头部 -->
    <view class="header-bar" :style="{ height: headerHeight, paddingTop: statusBarHeight + 'px' }">
      <view class="left-section">
        <view class="back-button" @click="goBack">
          <uni-icons type="left" size="24" color="#333"></uni-icons>
        </view>
      </view>
      <view class="center-section">
        <text class="header-title">个人主页</text>
      </view>
       <view class="right-section"></view> <!-- 右侧占位符 -->
    </view>

    <!-- 页面内容区域 -->
    <view class="content" :style="{ paddingTop: headerHeight }">
      <!-- 详情页的具体内容将稍后添加 -->
      <text>个人主页内容区域</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
// uni-icons will be automatically imported via easycom

// 获取胶囊按钮位置信息和状态栏高度（用于计算自定义头部高度）
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
// H5端模拟一个固定高度的头部
const h5HeaderHeight = 44;
menuButtonTop.value = 0; // Not applicable for H5
menuButtonHeight.value = h5HeaderHeight; // Use standard header height for calculation
// #endif

// 计算头部总高度
const headerHeight = computed(() => {
  // #ifdef MP-WEIXIN
  return menuButtonTop.value + menuButtonHeight.value + 'px';
  // #endif
  // #ifdef H5
  return (statusBarHeight.value + h5HeaderHeight) + 'px';
  // #endif
  return '0px'; // Default
});

// 返回上一页
const goBack = () => {
  uni.navigateBack();
};

onLoad(() => {
  console.log('Personal Detail Page Loaded');
});

onMounted(() => {
  // 如果有需要在页面 mounted 时执行的逻辑可以放这里
});

</script>

<style lang="scss" scoped>
.container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: linear-gradient(135deg, #f8f8ff 0%, #e0e7ff 100%);
  padding: 0 20rpx 20rpx 20rpx; /* Add padding to the bottom and sides */
  box-sizing: border-box; /* Include padding in the element's total width and height */
}

/* 自定义头部样式 */
.header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20rpx; /* Add horizontal padding */
  width: 100%;
  box-sizing: border-box;
  background: linear-gradient(135deg, #f8f8ff 0%, #e0e7ff 100%); /* Background color similar to other pages */

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

.center-section {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.header-title {
  font-size: 36rpx; /* Adjust size as needed */
  font-weight: bold;
  color: #333;
}

/* 右侧占位符样式 */
.right-section {
    display: flex;
    align-items: center;
     height: 100%;
     width: 60rpx; /* Match the width of the back button section */
}

.back-button {
  width: 60rpx; /* Set a fixed width for the back button area */
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  height: 100%;
}

/* 页面内容区域样式 */
.content {
  flex: 1;
  width: 100%;
  box-sizing: border-box;
  /* padding-top is applied via :style to account for header height */
  overflow-y: auto; /* Enable scrolling for content */
}

</style> 