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
        <text class="header-title">考试记录</text>
      </view>
       <view class="right-section"></view> <!-- 右侧占位符 -->
    </view>

    <!-- 页面内容区域 -->
    <scroll-view 
      scroll-y 
      class="record-scroll"
      :style="{ paddingTop: headerHeight }"
    >
      <view v-if="examRecordStore.loading" class="loading">
        <text>加载中...</text>
      </view>
      <view v-else-if="examRecordStore.error" class="error">
        <text>{{ examRecordStore.error }}</text>
      </view>
      <view v-else-if="examRecordStore.examRecordList.length === 0" class="empty">
        <text>暂无考试记录</text>
      </view>
      <view v-else class="record-items">
        <view 
          v-for="record in examRecordStore.examRecordList" 
          :key="record.recordId"
          class="record-item"
          @click="goToRecordDetail(record)"
        >
          <view class="record-info">
            <text class="record-title">{{ record.paperName }}</text>
            <text class="record-score">总分：{{ record.totalScore || 'N/A' }}分</text>
            <text class="record-time">开始时间：{{ record.startTime }}</text>
          </view>
          <uni-icons type="right" size="16" color="#999"></uni-icons>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useExamRecordStore } from '@/stores/examRecord';
// uni-icons will be automatically imported via easycom

const examRecordStore = useExamRecordStore();

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

// 跳转到考试记录详情（待实现）
const goToRecordDetail = (record) => {
  console.log('Navigate to record detail:', record);
  // TODO: Implement navigation to record detail page, passing record.recordId
};

onLoad(async () => {
  console.log('Exam Record Page Loaded');
  const studentId = uni.getStorageSync('id'); // Get studentId from local storage
  if (studentId) {
    await examRecordStore.fetchExamRecords(studentId); // Fetch records
  } else {
    console.error('Student ID not found in local storage.');
    examRecordStore.error = '无法获取学生ID，请尝试重新登录。';
     uni.showToast({
      title: examRecordStore.error,
      icon: 'none'
    });
  }
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
  padding: 0 20rpx;
  width: 100%;
  box-sizing: border-box;
  background: linear-gradient(135deg, #f8f8ff 0%, #e0e7ff 100%);

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
  font-size: 36rpx;
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
  width: 60rpx;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  height: 100%;
}

/* 页面内容区域样式 */
.record-scroll {
  height: 100vh;
  box-sizing: border-box;
  /* padding-top is applied via :style to account for header height */
  overflow-y: auto; /* Enable scrolling for content */
}

.record-items {
  padding: 15px;
}

.record-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px;
  margin-bottom: 10px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  
  .record-info {
    flex: 1;
    margin-right: 10px;
    display: flex;
    flex-direction: column;
  }

  .record-title {
    display: block;
    font-size: 16px;
    color: #333;
    margin-bottom: 5px;
  }

  .record-score, .record-time {
    font-size: 14px;
    color: #666;
    margin-bottom: 3px;
    &:last-child { margin-bottom: 0; }
  }
}

.loading, .error, .empty {
  padding: 20px;
  text-align: center;
  color: #999;
}

</style> 