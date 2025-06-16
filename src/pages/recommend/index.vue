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
        <text class="header-title">优卷智推</text>
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
            <view class="question-row">
              <text class="question-difficulty">{{ question.remark || '无备注' }}</text>
              <text class="question-status">
                状态：<text :class="['status-value',
                  question.statusDesc === '已结束' || question.statusDesc === '已取消' ? 'status-red' :
                  question.statusDesc === '进行中' ? 'status-orange' :
                  question.statusDesc === '未开始' ? 'status-green' : ''
                ]">{{ question.statusDesc }}</text>
              </text>
            </view>
            <text class="question-time">开始时间：{{ question.startTime }}</text>
            <text class="question-time">截止时间：{{ question.deadline }}</text>
          </view>
          <uni-icons type="right" size="16" color="#999"></uni-icons>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { onMounted, ref, computed } from 'vue';
import { getPapersPushList, checkExamAttempts } from '@/api/exam'; // 引入新的接口函数

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
  // 尝试获取当前页面路由信息
  const pages = getCurrentPages();
  if (pages.length <= 1) {
    // 从当前 URL 获取参数
    const currentPage = pages[0];
    
    // 构造返回到首页的 URL
    let url = '/pages/index/index';
    
    // 重新导航到首页
    uni.switchTab({
      url: url,
      fail: () => {
        // 如果重定向失败，尝试使用 navigateTo
        uni.navigateTo({ url: url });
      }
    });
  } else {
    // 正常场景，直接返回上一页
    uni.navigateBack();
  }
};

// 跳转到试卷详情 (先检查是否可以参加考试，再决定是否跳转)
const goToQuestionDetail = async (question) => {
  const studentId = uni.getStorageSync('id');
  const pushId = question.pushId;
  if (!studentId || !pushId) {
    uni.showToast({ title: '用户信息缺失', icon: 'none' });
    return;
  }
  try {
    const res = await checkExamAttempts(studentId, pushId);
    if (res.flag === '1' && res.result) {
      if (res.result.canTakeExam) {
        // 允许考试，跳转
        uni.navigateTo({
          url: `/pages/exam/intro/index?sourceId=${question.paperId}${question.pushId ? `&pushId=${question.pushId}` : ''}`
        });
      } else {
        // 不允许考试，提示原因
        uni.showToast({
          title: res.result.message || '无法参加考试',
          icon: 'none',
          duration: 2500
        });
      }
    } else {
      uni.showToast({
        title: res.msg || '检查考试资格失败',
        icon: 'none',
        duration: 2000
      });
    }
  } catch (err) {
    uni.showToast({
      title: '网络异常，请稍后重试',
      icon: 'none',
      duration: 2000
    });
  }
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

  .question-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
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

  .question-status {
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

.question-time {
  font-size: 13px;
  color: #999;
  margin-top: 2px;
  display: block;
}

.status-value {
  font-weight: bold;
}
.status-red {
  color: #e74c3c;
}
.status-orange {
  color: #ff9800;
}
.status-green {
  color: #4caf50;
}
</style> 