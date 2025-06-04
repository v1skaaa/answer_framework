<template>
  <view class="test-container">
    <view class="page-title">请选择</view>
    <view class="test-list">
      <view 
        v-for="item in testStore.sortedPaperTypes" 
        :key="item.typeId"
        class="test-item" 
        @click="goToPage(item)"
      >
        <view class="item-content">{{ item.typeName }}</view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { onMounted } from 'vue';
import { useTestStore } from '@/stores/test';

const testStore = useTestStore();

// 页面导航逻辑
const goToPage = (item) => {
  // 存储当前选中的试卷类型信息
  testStore.setCurrentType(item);

  // 统一跳转到试卷列表页面
  uni.navigateTo({ 
    url: '/pages/test/paperList/index',
    fail: (err) => {
      console.error('Navigation failed:', err);
      uni.showToast({
        title: '跳转失败',
        icon: 'none'
      });
  }
  });
};

// 页面加载时获取数据
onMounted(async () => {
  try {
    await testStore.fetchPaperTypes();
  } catch (error) {
    uni.showToast({
      title: '获取数据失败',
      icon: 'none'
    });
  }
});
</script>

<style lang="scss">
// 定义渐变颜色数组
$gradient-colors: (
  #a6c0fe, rgba(198, 177, 246, 0.31),
  #70c1ff, rgba(51, 216, 92, 0.54),
  #ffaa7f, #ff7eb3,
  #a8edea, #fed6e3,
  #ffecd2, #fcb69f,
  #a6c0fe, rgba(198, 177, 246, 0.31),
  #70c1ff, rgba(51, 216, 92, 0.54),
  #ffaa7f, #ff7eb3,
  #a8edea, #fed6e3,
  #ffecd2, #fcb69f
);

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
  gap: 60rpx;
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

  display: flex;
  align-items: center;
  min-height: 120rpx;

  &:active {
    transform: scale(0.98);
    box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.1);
  }
}

.item-content {
  flex: 1;
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  text-align: center;
}

/* 动态生成渐变背景 */
.test-item {
  @for $i from 1 through 10 {
    &:nth-child(#{$i}) {
      background: linear-gradient(135deg, nth($gradient-colors, $i * 2 - 1) 0%, nth($gradient-colors, $i * 2) 100%);
      .item-content { color: #333; }
    }
  }
}
</style> 