<template>
  <view class="recommend-list-page">
    <!-- 头部栏 -->
    <view class="header-bar" :style="{ height: headerHeight, paddingTop: statusBarHeight + 'px' }">
      <view class="left-section">
        <view class="back-button" @click="goBack">
          <uni-icons type="left" size="24" color="#333"></uni-icons>
        </view>
      </view>
      <view class="center-section">
        <text class="header-title">每日推题</text>
      </view>
      <view class="right-section"></view>
    </view>

    <!-- 题目列表 -->
    <scroll-view
      scroll-y
      class="question-scroll"
      :style="{ paddingTop: headerHeight }"
    >
      <view v-if="loading" class="loading">
        <text>加载中...</text>
      </view>
      <view v-else-if="error" class="error">
        <text>{{ error }}</text>
      </view>
      <view v-else-if="questionList.length === 0" class="empty">
        <text>暂无推荐题目</text>
      </view>
      <view v-else class="question-items">
        <view
          v-for="question in questionList"
          :key="question.paperId"
          class="question-item"
          @click="goToQuestionDetail(question)"
        >
          <view class="question-info">
            <text class="question-title">{{ question.paperName }}</text>
            <text class="question-difficulty">类型：{{ question.typeName || '未知类型' }}</text>
            <text class="question-score">总分：{{ question.totalScore }}分</text>
            <text class="question-status">状态：{{ question.statusDesc }}</text>
          </view>
          <uni-icons type="right" size="16" color="#999"></uni-icons>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { onMounted, ref, computed } from 'vue';
import { getPapersPushList } from '@/api/exam'; // 引入新的接口函数

// 模拟数据 -> 实际数据
const questionList = ref([]);
const loading = ref(true);
const error = ref(null);

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
  uni.navigateBack();
};

// 跳转到试卷详情 (修改为跳转到试卷介绍页，并传递 paperId)
const goToQuestionDetail = (question) => {
  uni.navigateTo({
    url: `/pages/exam/intro/index?sourceId=${question.paperId}`
  });
};

// 加载每日推题数据
const loadQuestions = async () => {
  loading.value = true;
  error.value = null;
  try {
    const studentId = uni.getStorageSync('id'); // 获取 studentId
    if (!studentId) {
      error.value = '用户ID未找到，请重新登录';
      loading.value = false;
      uni.showToast({ title: '用户ID未找到', icon: 'none' });
      setTimeout(() => { uni.redirectTo({ url: '/pages/login/index' }); }, 1500);
      return;
    }

    const response = await getPapersPushList(studentId);
    if (response.flag === '1' && response.result) {
      questionList.value = response.result;
    } else {
      error.value = response.msg || '获取推荐题目失败';
    }
  } catch (err) {
    console.error('调用每日推题接口失败:', err);
    error.value = '网络请求失败，请检查网络';
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadQuestions();
});
</script>

<style lang="scss" scoped>
.recommend-list-page {
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

.question-scroll {
  height: 100vh;
  box-sizing: border-box;
}

.question-items {
  padding: 15px;
}

.question-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px;
  margin-bottom: 10px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

  .question-info {
    flex: 1;
    margin-right: 10px;
  }

  .question-title {
    display: block;
    font-size: 16px;
    color: #333;
    margin-bottom: 5px;
  }

  .question-difficulty {
    font-size: 14px;
    padding: 2px 6px;
    border-radius: 4px;
    /* Using different styles for clarity */
    background-color: #f0f0f0; /* Default background */
    color: #666; /* Default text color */
    margin-top: 5px; /* Add some spacing */
  }

  .question-score, .question-status {
    font-size: 14px;
    color: #666;
    margin-top: 5px;
  }
}

.loading, .error, .empty {
  padding: 20px;
  text-align: center;
  color: #999;
}
</style> 