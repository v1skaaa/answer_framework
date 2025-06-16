<template>
  <view class="paper-list">
    <!-- 头部栏 -->
    <view class="header-bar" :style="{ height: headerHeight, paddingTop: statusBarHeight + 'px' }">
      <view class="left-section">
        <view class="back-button" @click="goBack">
          <uni-icons type="left" size="24" color="#333"></uni-icons>
        </view>
      </view>
      <view class="center-section">
        <text class="header-title">{{ testStore.currentType?.typeName || '试卷列表' }}</text>
      </view>
      <view class="right-section"></view>
    </view>

    <!-- 试卷列表 -->
    <scroll-view 
      scroll-y 
      class="paper-scroll"
      :style="{ paddingTop: headerHeight }"
    >
      <view v-if="testStore.loading" class="loading">
        <text>加载中...</text>
      </view>
      <view v-else-if="testStore.error" class="error">
        <text>{{ testStore.error }}</text>
      </view>
      <view v-else-if="testStore.paperList.length === 0" class="empty">
        <text>暂无试卷</text>
      </view>
      <view v-else class="paper-items">
        <view 
          v-for="paper in testStore.paperList" 
          :key="paper.id"
          class="paper-item"
          @click="goToPaperDetail(paper)"
        >
          <view class="paper-info">
            <text class="paper-title">{{ paper.title }}</text>
            <text class="paper-score">总分：{{ paper.totalScore }}分</text>
          </view>
          <uni-icons type="right" size="16" color="#999"></uni-icons>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { onMounted, ref, computed } from 'vue';
import { useTestStore } from '@/stores/test';

const testStore = useTestStore();

// 获取胶囊按钮位置信息和状态栏高度
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
menuButtonTop.value = 0;
menuButtonHeight.value = h5HeaderHeight;
// #endif

// 计算头部总高度
const headerHeight = computed(() => {
  // #ifdef MP-WEIXIN
  return menuButtonTop.value + menuButtonHeight.value + 'px';
  // #endif
  // #ifdef H5
  return (statusBarHeight.value + h5HeaderHeight) + 'px';
  // #endif
  return '0px';
});

// 返回上一页
const goBack = () => {
  // 尝试获取当前页面路由信息
  const pages = getCurrentPages();
  
  // 如果页面栈长度为1，表示当前页面是唯一页面（可能是刷新导致）
  if (pages.length <= 1) {
    // 构造返回到 test 页面的 URL
    let url = '/pages/test/index';
    
    // 使用 switchTab 跳转到 tabBar 页面
    uni.switchTab({
      url: url,
      fail: () => {
        console.error('Navigation failed:', err);
        uni.showToast({
          title: '返回失败',
          icon: 'none'
        });
      }
    });
  } else {
    // 正常场景，直接返回上一页
    uni.navigateBack();
  }
};

// 跳转到试卷详情
const goToPaperDetail = (paper) => {
  uni.navigateTo({
    url: `/pages/exam/intro/index?sourceId=${paper.id}`
  });
};

// 页面加载时获取试卷列表
onMounted(async () => {
  // 从 URL 参数中获取 typeId
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  const typeId = currentPage.options?.typeId;

  if (typeId) {
    try {
      // 如果 URL 中有 typeId，使用它来获取试卷列表
      await testStore.fetchPaperList(typeId);
    } catch (error) {
      console.error('获取试卷列表失败:', error);
    }
  } else if (testStore.currentType?.typeId) {
    // 如果 URL 中没有 typeId，但有存储的 currentType，使用它
    try {
      await testStore.fetchPaperList(testStore.currentType.typeId);
    } catch (error) {
      console.error('获取试卷列表失败:', error);
    }
  } else {
    uni.showToast({
      title: '未选择试卷类型',
      icon: 'none'
    });
    setTimeout(() => {
      uni.navigateBack();
    }, 1500);
  }
});
</script>

<style lang="scss" scoped>
.paper-list {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8f8ff 0%, #e0e7ff 100%);
  padding: 0 20rpx 20rpx 20rpx;
  box-sizing: border-box;
}

.header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20rpx;
  width: 100%;
  box-sizing: border-box;
  background: linear-gradient(135deg, #f8f8ff 0%, #e0e7ff 100%);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
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
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}

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

.paper-scroll {
  height: 100vh;
  box-sizing: border-box;
}

.paper-items {
  padding: 15px;
}

.paper-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px;
  margin-bottom: 10px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

  .paper-info {
    flex: 1;
    margin-right: 10px;
  }

  .paper-title {
    display: block;
    font-size: 16px;
    color: #333;
    margin-bottom: 5px;
  }

  .paper-score {
    font-size: 14px;
    color: #666;
  }
}

.loading, .error, .empty {
  padding: 20px;
  text-align: center;
  color: #999;
}
</style> 