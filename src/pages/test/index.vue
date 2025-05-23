<template>
  <view class="test-container">
    <view class="page-title">请选择</view>
    <view class="test-list">
      <view class="test-item" @click="goToPage('gaokaoZhenti')">
        <view class="item-content">高考真题</view>
      </view>
      <view class="test-item" @click="goToPage('contest')">
        <view class="item-content">竞赛</view>
      </view>
      <view class="test-item" @click="goToPage('gaokaoMoniti')">
        <view class="item-content">高考模拟</view>
      </view>
      <view class="test-item" @click="goToPage('qimo')">
        <view class="item-content">期末考试</view>
      </view>
      <view class="test-item" @click="goToPage('qizhong')">
        <view class="item-content">期中考试</view>
      </view>
    </view>
  </view>
</template>

<script setup>
// Navigation logic for buttons
const goToPage = (type) => {
  console.log('Navigate to page for:', type);
  if (type === 'gaokaoZhenti') {
    uni.navigateTo({ url: '/pages/test/gaokaoZhenti/index' });
  } else if (type === 'qimo') {
    uni.navigateTo({ url: '/pages/test/qimo/index' });
  }
  // TODO: Handle navigation for other types
};
</script>

<style lang="scss">
.test-container {
  padding: 40rpx 20rpx;
  background: linear-gradient(135deg, #f8f8ff 0%, #e0e7ff 100%);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.page-title {
  font-size: 36rpx;
  font-weight: bold;
  text-align: center;
  margin-bottom: 40rpx;
  color: #333;
}

.test-list {
  display: flex;
  flex-direction: column;
  gap: 60rpx; // Space between cards
  width: 100%;
}

.test-item {
  width: 100%;
  background-color: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  box-sizing: border-box;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;

  display: flex; // Use flex to center content vertically
  align-items: center;
  min-height: 120rpx; // Give cards a minimum height

  &:active {
    transform: scale(0.98);
    box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.1);
  }
}

.item-content {
  flex: 1; // Allow text to take available space
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  text-align: center; // Center text horizontally within the card
}

/* Optional: Add gradients to cards for variety */
.test-item:nth-child(1) { background: linear-gradient(135deg, #a6c0fe 0%,rgba(198, 177, 246, 0.31) 100%); .item-content { color: #333; } }
.test-item:nth-child(2) { background: linear-gradient(135deg, #70c1ff 0%,rgba(51, 216, 92, 0.54) 100%); .item-content { color: #333; } }
.test-item:nth-child(3) { background: linear-gradient(135deg, #ffaa7f 0%, #ff7eb3 100%); .item-content { color: #333; } }
.test-item:nth-child(4) { background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); .item-content { color: #333; } }
.test-item:nth-child(5) { background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%); .item-content { color: #333; } }

</style> 