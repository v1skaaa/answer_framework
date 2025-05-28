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
      <view v-if="testStore.loading" class="loading">加载中...</view>
      <view v-else-if="testStore.paperList.length === 0" class="no-data">暂无试卷</view>
      <view v-else class="paper-item" v-for="(item, index) in testStore.paperList" :key="index" @click="goToPaperDetail(item)">
        <view class="paper-info">
          <text class="paper-title">{{ item.title }}</text>
        </view>
        <view class="paper-arrow">
          <uni-icons type="right" size="16" color="#999"></uni-icons>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useTestStore } from '@/stores/test';
// uni-icons will be automatically imported via easycom
 
// 获取胶囊按钮位置信息
const menuButtonHeight = ref(0);
const menuButtonTop = ref(0);
const navBarHeight = ref(0);
const systemInfo = uni.getSystemInfoSync();
const statusBarHeight = systemInfo.statusBarHeight;

// 获取试卷 store
const testStore = useTestStore();

// 计算头部总高度
const headerHeight = computed(() => {
  // #ifdef MP-WEIXIN
  return menuButtonTop.value + menuButtonHeight.value + 'px';
  // #endif
  // #ifdef H5
  return (statusBarHeight + 44) + 'px';
  // #endif
  return '0px';
});

// 计算内容区域的顶部内边距
const containerPaddingTop = computed(() => {
  const extraSpace = 20;
  // #ifdef MP-WEIXIN
  return menuButtonTop.value + menuButtonHeight.value + extraSpace + 'px';
  // #endif
  // #ifdef H5
  return (statusBarHeight + 44 + extraSpace) + 'px';
  // #endif
  return '0px';
});

// 获取试卷列表
const fetchPaperList = async () => {
  try {
    await testStore.fetchPaperList();
  } catch (error) {
    uni.showToast({
      title: '获取试卷列表失败',
      icon: 'none'
    });
  }
};

onMounted(() => {
  // #ifdef MP-WEIXIN
  const menuButtonInfo = uni.getMenuButtonBoundingClientRect();
  menuButtonHeight.value = menuButtonInfo.height;
  menuButtonTop.value = menuButtonInfo.top;
  navBarHeight.value = statusBarHeight + menuButtonInfo.height + 8;
  // #endif
  
  // 获取试卷列表
  fetchPaperList();
});

// 跳转到试卷详情页
const goToPaperDetail = (item) => {
  console.log('goToPaperDetail called with item:', item);
  if (!item || !item.id) {
    console.error('Invalid item or item.id for navigation:', item);
    uni.showToast({
      title: '试卷信息错误，无法跳转',
      icon: 'none'
    });
    return; // 如果item或item.id无效，则停止执行
  }

  const url = `/pages/exam/intro/index?sourceId=${item.id}`; // 通过URL参数传递sourceId
  console.log('Navigating to intro page with URL:', url); // 添加日志确认导航URL

  uni.navigateTo({
    url: url,
    // 移除 events 参数，不再使用事件通道
    // events: {
    //   acceptPaperData: function(data) {
    //     console.log('Answering page received data:', data);
    //   }
    // },
    success: function(res) {
      console.log('Navigation success to intro page'); // 添加日志确认导航成功
      // 移除 eventChannel.emit，因为不再使用事件通道
      // res.eventChannel.emit('acceptPaperData', { paper: item });
      // console.log('Event emitted: acceptPaperData with paper data', item); // Add log
    },
    fail: function(err) {
      console.error('Navigation failed to intro page:', err); // 添加日志确认导航失败原因
      uni.showToast({
        title: '跳转失败',
        icon: 'none'
      });
    }
  });
};

// 返回上一页
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
  }
}

.paper-arrow {
  display: flex;
  align-items: center;
}

.loading, .no-data {
  text-align: center;
  color: #999;
  padding: 40rpx 0;
}
</style> 