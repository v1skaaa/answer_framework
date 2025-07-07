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
        <text class="header-title">意见反馈</text>
      </view>
      <view class="right-section"></view>
    </view>
    <!-- 内容区域 -->
    <view class="content" :style="{ paddingTop: headerHeight }">
      <view v-if="loading" class="loading">
        <text>加载中...</text>
      </view>
      <view v-else-if="error" class="error">
        <text>{{ error }}</text>
      </view>
      <view v-else-if="feedbackList.length === 0" class="empty">
        <text>暂无反馈记录</text>
      </view>
      <view v-else class="feedback-items">
        <view v-for="item in feedbackList" :key="item.id" class="feedback-item">
          <view class="feedback-content">{{ item.content }}</view>
          <view class="feedback-time">{{ item.createdAt }}</view>
        </view>
      </view>
    </view>
    <!-- 右下角圆形填写反馈按钮 -->
    <view class="feedback-fab" @click="showFeedbackModal = true">
      <text>填写反馈</text>
    </view>
    <!-- 反馈弹窗 -->
    <view class="feedback-modal-mask" v-if="showFeedbackModal" @click="closeModal">
      <view class="feedback-modal" @click.stop>
        <view class="modal-header">
          <text class="modal-title">意见反馈</text>
          <text class="modal-close" @click="closeModal">×</text>
        </view>
        <view class="modal-body">
          <view class="modal-label">填写栏</view>
          <textarea
            v-model="feedbackContent"
            maxlength="200"
            class="modal-textarea"
            placeholder="请输入您的反馈（最多200字）"
            @input="onInput"
          />
          <view class="modal-limit">限制{{ feedbackContent.length }}/200字</view>
        </view>
        <view class="modal-footer">
          <button class="modal-submit" :disabled="!feedbackContent.trim()" @click="submitFeedback">提交反馈</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { getUserFeedback, submitUserFeedback } from '@/api/exam';
import { onLoad } from '@dcloudio/uni-app';

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
const h5HeaderHeight = 44;
menuButtonTop.value = 0;
menuButtonHeight.value = h5HeaderHeight;
// #endif

const headerHeight = computed(() => {
  // #ifdef MP-WEIXIN
  return menuButtonTop.value + menuButtonHeight.value + 'px';
  // #endif
  // #ifdef H5
  return (statusBarHeight.value + h5HeaderHeight) + 'px';
  // #endif
  return '0px';
});

const goBack = () => {
  uni.switchTab({
    url: '/pages/mine/index',
    fail: (err) => {
      console.error('Navigation failed:', err);
      uni.showToast({
        title: '返回失败',
        icon: 'none'
      });
    }
  });
};

const feedbackList = ref([]);
const loading = ref(false);
const error = ref('');

const fetchFeedback = async () => {
  loading.value = true;
  error.value = '';
  try {
    const userId = uni.getStorageSync('id');
    if (!userId) {
      error.value = '未获取到用户ID';
      loading.value = false;
      return;
    }
    const res = await getUserFeedback(userId);
    if (res.flag === '1') {
      feedbackList.value = res.result || [];
    } else {
      error.value = res.msg || '获取反馈失败';
    }
  } catch (e) {
    error.value = '获取反馈异常';
  } finally {
    loading.value = false;
  }
};

onLoad(() => {
  fetchFeedback();
});

const showFeedbackModal = ref(false);
const feedbackContent = ref('');
const onInput = (e) => {
  if (feedbackContent.value.length > 200) {
    feedbackContent.value = feedbackContent.value.slice(0, 200);
  }
};
const closeModal = () => {
  showFeedbackModal.value = false;
  feedbackContent.value = '';
};
const submitFeedback = async () => {
  const userId = uni.getStorageSync('id');
  if (!userId) {
    uni.showToast({ title: '未获取到用户ID', icon: 'none' });
    return;
  }
  if (!feedbackContent.value.trim()) {
    uni.showToast({ title: '请输入反馈内容', icon: 'none' });
    return;
  }
  try {
    const res = await submitUserFeedback(userId, feedbackContent.value.trim());
    if (res.flag === '1') {
      uni.showToast({ title: res.msg || '已提交', icon: 'success' });
      closeModal();
      fetchFeedback(); // 刷新反馈列表
    } else {
      uni.showToast({ title: res.msg || '提交失败', icon: 'none' });
    }
  } catch (e) {
    uni.showToast({ title: '提交异常', icon: 'none' });
  }
};
</script>

<style lang="scss" scoped>
.container {
  display: flex;
  flex-direction: column;
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
.content {
  flex: 1;
  width: 100%;
  box-sizing: border-box;
  overflow-y: auto;
}
.feedback-items {
  padding: 15px;
}
.feedback-item {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  padding: 18px 16px 12px 16px;
  margin-bottom: 14px;
  display: flex;
  flex-direction: column;
}
.feedback-content {
  font-size: 16px;
  color: #333;
  margin-bottom: 8px;
  word-break: break-all;
}
.feedback-time {
  font-size: 13px;
  color: #999;
  align-self: flex-end;
}
.loading, .error, .empty {
  padding: 20px;
  text-align: center;
  color: #999;
}
.feedback-fab {
  position: fixed;
  right: 40rpx;
  bottom: 60rpx;
  width: 120rpx;
  height: 120rpx;
  background: #fff;
  color: #007aff;
  border-radius: 50%;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  font-weight: bold;
  z-index: 1001;
  border: 2rpx solid #e0e7ff;
  cursor: pointer;
}

.feedback-modal-mask {
  position: fixed;
  left: 0; right: 0; top: 0; bottom: 0;
  background: rgba(0,0,0,0.35);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
}
.feedback-modal {
  width: 90vw;
  max-width: 380px;
  min-width: 260px;
  background: #fff;
  border-radius: 20rpx;
  box-shadow: 0 8rpx 32rpx rgba(0,0,0,0.18);
  display: flex;
  flex-direction: column;
  padding: 0 0 30rpx 0;
  animation: modalIn 0.2s;
  box-sizing: border-box;
}
@keyframes modalIn {
  from { transform: translateY(40rpx) scale(0.98); opacity: 0; }
  to { transform: none; opacity: 1; }
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30rpx 30rpx 0 30rpx;
}
.modal-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}
.modal-close {
  font-size: 40rpx;
  color: #999;
  cursor: pointer;
}
.modal-body {
  padding: 20rpx 30rpx 0 30rpx;
  display: flex;
  flex-direction: column;
}
.modal-label {
  font-size: 26rpx;
  color: #666;
  margin-bottom: 10rpx;
}
.modal-textarea {
  width: 96%;
  min-height: 120rpx;
  border-radius: 12rpx;
  border: 1rpx solid #e0e7ff;
  padding: 16rpx;
  font-size: 28rpx;
  color: #333;
  background: #f8f8ff;
  resize: none;
}
.modal-limit {
  font-size: 22rpx;
  color: #aaa;
  text-align: right;
  margin-top: 8rpx;
}
.modal-footer {
  padding: 30rpx 30rpx 0 30rpx;
}
.modal-submit {
  width: 100%;
  height: 80rpx;
  border-radius: 40rpx;
  background: #007aff;
  color: #fff;
  font-size: 30rpx;
  font-weight: bold;
  border: none;
  margin-top: 10rpx;
  opacity: 1;
  transition: opacity 0.2s;
}
.modal-submit:disabled {
  opacity: 0.5;
}
</style> 