<template>
  <view class="container">
    <view class="header">
      <image class="avatar" :src="'/static/images/default-avatar.png'" mode="aspectFill"></image>
      <text class="username">{{ userInfo.nickname || userInfo.username }}</text>
    </view>
    <view class="stats-bar">
      <view class="stats-item">
        <text class="stats-label">练习记录</text>
        <text class="stats-value">{{ userStats.totalQuestions }}</text>
      </view>
      <text class="stats-divider">|</text>
      <view class="stats-item">
        <text class="stats-label">错题本</text>
        <text class="stats-value">{{ userStats.wrongQuestions }}</text>
      </view>
      <text class="stats-divider">|</text>
      <view class="stats-item">
        <text class="stats-label">收藏本</text>
        <text class="stats-value">{{ userStats.favoriteQuestions }}</text>
      </view>
    </view>
    <view class="menu-group">
      <view class="menu-group-title">通用</view>
      <view class="menu-list">
        <view class="menu-item" @click="navTo('/pages/mine/messages')">
          <view class="menu-icon"><uni-icons type="chatboxes" size="22" color="#a6c0fe"></uni-icons></view>
          <text class="menu-text">消息中心</text>
          <text class="menu-arrow">></text>
        </view>
        <view class="menu-item" @click="navTo('/pages/mine/settings')">
          <view class="menu-icon"><uni-icons type="gear" size="22" color="#a6c0fe"></uni-icons></view>
          <text class="menu-text">设置</text>
          <text class="menu-arrow">></text>
        </view>
        <view class="menu-item" @click="navTo('/pages/mine/customerService')">
          <view class="menu-icon"><uni-icons type="headphones" size="22" color="#4caf50"></uni-icons></view>
          <text class="menu-text">客服</text>
          <text class="menu-arrow">></text>
        </view>
      </view>
    </view>
    <view class="menu-group">
      <view class="menu-group-title">练习</view>
      <view class="menu-list">
        <view class="menu-item" @click="navTo('/pages/mine/ranking')">
          <view class="menu-icon"><uni-icons type="medal" size="22" color="#ffaa7f"></uni-icons></view>
          <text class="menu-text">排行榜</text>
          <text class="menu-arrow">></text>
        </view>
      </view>
    </view>
    <view class="logout-btn" @click="showLogoutConfirm">
      <text>退出登录</text>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';

// 保留原有的用户信息和统计数据模拟，根据需要进行调整
const userInfo = ref({
  username: '用户123456',
  nickname: 'Singeer',
  avatar: '', // 图片上没有头像，这里可以留空或使用默认
  level: 5,
  exp: 325,
  nextLevelExp: 500
});

// 更新统计数据，增加错题和收藏数量
const userStats = ref({
  totalDays: 7,
  totalQuestions: 92, // 练习记录数量
  correctRate: 85,
  wrongQuestions: 23, // 错题本数量
  favoriteQuestions: 5 // 收藏本数量
});

// 保留原有的导航方法，根据需要修改跳转路径
const navTo = (url) => {
  uni.navigateTo({
    url: url
  });
};

// 保留原有的退出登录逻辑
const showLogoutConfirm = () => {
  uni.showModal({
    title: '提示',
    content: '确定要退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        logout();
      }
    }
  });
};

const logout = () => {
  uni.removeStorageSync('token');
  uni.removeStorageSync('userInfo');
  uni.reLaunch({
    url: '/pages/login/index'
  });
};

onMounted(() => {
  // 获取真实用户数据或使用模拟数据
  const token = uni.getStorageSync('token');
  if (!token) {
    uni.redirectTo({
      url: '/pages/login/index'
    });
    return;
  }
  // 这里可以调用API获取用户真实数据
  // getUserInfo();
  // getUserStats();
});
</script>

<style lang="scss">
.container {
  padding: 20rpx;
  background: linear-gradient(135deg, #f8f8ff 0%, #e0e7ff 100%);
  min-height: 100vh;
}

.header {
  display: flex;
  align-items: center;
  padding: 40rpx 20rpx;
  background: linear-gradient(135deg, #a6c0fe, #c2a8fd);
  color: #fff;
  border-radius: 20rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
}

.avatar {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  border: 4rpx solid rgba(255, 255, 255, 0.5);
  background-color: #fff;
  margin-right: 20rpx;
}

.avatar-placeholder {
  display: none;
}

.username {
  font-size: 36rpx;
  font-weight: bold;
}

.stats-bar {
  display: flex;
  justify-content: center;
  background-color: #fff;
  border-radius: 20rpx;
  padding: 20rpx 0;
  margin-bottom: 30rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.stats-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 28rpx;
  color: #333;
  padding: 0 65rpx;
}

.stats-label {
  font-size: 28rpx;
  color: #333;
  margin-bottom: 8rpx;
}

.stats-value {
  font-size: 24rpx;
  color: #888;
}

.stats-divider {
  color: #ccc;
  display: flex;
  align-items: center;
}

.menu-group {
  margin-bottom: 20rpx;
  &:last-child { margin-bottom: 30rpx; }
}

.menu-group-title {
  font-size: 24rpx;
  color: #888;
  padding: 10rpx 20rpx;
}

.menu-list {
  background-color: #fff;
  border-radius: 20rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 25rpx 20rpx;
  border-bottom: 1rpx solid #eee;
  &:last-child { border-bottom: none; }
}

.menu-icon {
  margin-right: 20rpx;
  display: flex;
  align-items: center;
}

.menu-text {
  flex: 1;
  font-size: 28rpx;
  color: #333;
}

.menu-arrow {
  font-size: 28rpx;
  color: #ccc;
  margin-left: 20rpx;
}

.logout-btn {
  background-color: #fff;
  border-radius: 45rpx;
  height: 90rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30rpx;
  color: #f44336;
  box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.05);
  margin-top: 30rpx;
  &:active {
    background-color: #f9f9f9;
  }
}
</style> 