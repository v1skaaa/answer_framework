<template>
  <view class="container">
    <!-- 用户信息卡片 -->
    <view class="user-card">
      <view class="user-info">
        <image class="avatar" :src="userInfo.avatar || '/static/images/default-avatar.png'" mode="aspectFill"></image>
        <view class="user-detail">
          <text class="username">{{ userInfo.nickname || userInfo.username }}</text>
          <view class="user-level">
            <text class="level-text">Lv.{{ userInfo.level }}</text>
            <view class="progress-bar">
              <view class="progress" :style="{ width: userInfo.exp / userInfo.nextLevelExp * 100 + '%' }"></view>
            </view>
            <text class="exp-text">{{ userInfo.exp }}/{{ userInfo.nextLevelExp }}</text>
          </view>
        </view>
      </view>
      <view class="stats-row">
        <view class="stats-item">
          <text class="stats-value">{{ userStats.totalDays }}</text>
          <text class="stats-label">坚持天数</text>
        </view>
        <view class="stats-item">
          <text class="stats-value">{{ userStats.totalQuestions }}</text>
          <text class="stats-label">刷题数</text>
        </view>
        <view class="stats-item">
          <text class="stats-value">{{ userStats.correctRate }}%</text>
          <text class="stats-label">正确率</text>
        </view>
      </view>
    </view>
    
    <!-- 功能菜单 -->
    <view class="menu-section">
      <view class="menu-group">
        <view class="menu-item" @click="navTo('/pages/mine/favorite')">
          <view class="menu-icon">
            <uni-icons type="star-filled" size="22" color="#ffc107"></uni-icons>
          </view>
          <text class="menu-text">我的收藏</text>
          <uni-icons type="right" size="16" color="#ccc"></uni-icons>
        </view>
        <view class="menu-item" @click="navTo('/pages/mine/wrong')">
          <view class="menu-icon">
            <uni-icons type="info-filled" size="22" color="#f44336"></uni-icons>
          </view>
          <text class="menu-text">错题本</text>
          <uni-icons type="right" size="16" color="#ccc"></uni-icons>
        </view>
        <view class="menu-item" @click="navTo('/pages/mine/history')">
          <view class="menu-icon">
            <uni-icons type="calendar" size="22" color="#4caf50"></uni-icons>
          </view>
          <text class="menu-text">做题记录</text>
          <uni-icons type="right" size="16" color="#ccc"></uni-icons>
        </view>
      </view>
      
      <view class="menu-group">
        <view class="menu-item" @click="navTo('/pages/mine/settings')">
          <view class="menu-icon">
            <uni-icons type="gear" size="22" color="#2196f3"></uni-icons>
          </view>
          <text class="menu-text">设置</text>
          <uni-icons type="right" size="16" color="#ccc"></uni-icons>
        </view>
        <view class="menu-item" @click="navTo('/pages/mine/feedback')">
          <view class="menu-icon">
            <uni-icons type="chat" size="22" color="#9c27b0"></uni-icons>
          </view>
          <text class="menu-text">意见反馈</text>
          <uni-icons type="right" size="16" color="#ccc"></uni-icons>
        </view>
        <view class="menu-item" @click="navTo('/pages/mine/about')">
          <view class="menu-icon">
            <uni-icons type="info" size="22" color="#607d8b"></uni-icons>
          </view>
          <text class="menu-text">关于我们</text>
          <uni-icons type="right" size="16" color="#ccc"></uni-icons>
        </view>
      </view>
    </view>
    
    <!-- 退出登录按钮 -->
    <view class="logout-btn" @click="showLogoutConfirm">
      <text>退出登录</text>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';

// 用户信息
const userInfo = ref({
  username: '用户123456',
  nickname: '用户11408',
  avatar: '',
  level: 5,
  exp: 325,
  nextLevelExp: 500
});

// 用户统计
const userStats = ref({
  totalDays: 7,
  totalQuestions: 42,
  correctRate: 85
});

// 页面跳转
const navTo = (url) => {
  uni.navigateTo({
    url: url
  });
};

// 显示退出确认
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

// 退出登录
const logout = () => {
  // 清除本地存储的登录信息
  uni.removeStorageSync('token');
  uni.removeStorageSync('userInfo');
  
  // 返回登录页
  uni.reLaunch({
    url: '/pages/login/index'
  });
};

onMounted(() => {
  // 获取真实用户数据
  const token = uni.getStorageSync('token');
  if (!token) {
    uni.redirectTo({
      url: '/pages/login/index'
    });
    return;
  }
  
  // 这里可以通过API获取用户真实数据
  // getUserInfo();
  // getUserStats();
});
</script>

<style lang="scss">
.container {
  padding: 20rpx;
  background-color: #f8f8f8;
  min-height: 100vh;
}

// 用户信息卡片样式
.user-card {
  background: linear-gradient(135deg, #a6c0fe, #c2a8fd);
  border-radius: 20rpx;
  padding: 40rpx 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
  color: #fff;
  
  .user-info {
    display: flex;
    align-items: center;
    margin-bottom: 30rpx;
    
    .avatar {
      width: 120rpx;
      height: 120rpx;
      border-radius: 50%;
      border: 4rpx solid rgba(255, 255, 255, 0.5);
      background-color: #fff;
    }
    
    .user-detail {
      margin-left: 20rpx;
      flex: 1;
      
      .username {
        font-size: 36rpx;
        font-weight: bold;
        margin-bottom: 10rpx;
        display: block;
      }
      
      .user-level {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        
        .level-text {
          font-size: 24rpx;
          background-color: rgba(255, 255, 255, 0.2);
          padding: 4rpx 12rpx;
          border-radius: 20rpx;
          margin-right: 15rpx;
          margin-bottom: 10rpx;
        }
        
        .progress-bar {
          flex: 1;
          height: 10rpx;
          background-color: rgba(255, 255, 255, 0.2);
          border-radius: 10rpx;
          overflow: hidden;
          margin-right: 10rpx;
          margin-bottom: 10rpx;
          
          .progress {
            height: 100%;
            background-color: #fff;
            border-radius: 10rpx;
          }
        }
        
        .exp-text {
          font-size: 20rpx;
          white-space: nowrap;
        }
      }
    }
  }
  
  .stats-row {
    display: flex;
    justify-content: space-around;
    text-align: center;
    
    .stats-item {
      flex: 1;
      
      .stats-value {
        font-size: 40rpx;
        font-weight: bold;
        display: block;
        margin-bottom: 5rpx;
      }
      
      .stats-label {
        font-size: 24rpx;
        opacity: 0.8;
      }
    }
  }
}

// 菜单区域样式
.menu-section {
  margin-bottom: 40rpx;
  
  .menu-group {
    background-color: #fff;
    border-radius: 20rpx;
    margin-bottom: 20rpx;
    overflow: hidden;
    box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.05);
    
    .menu-item {
      display: flex;
      align-items: center;
      padding: 30rpx;
      border-bottom: 1px solid #f5f5f5;
      
      &:last-child {
        border-bottom: none;
      }
      
      .menu-icon {
        margin-right: 20rpx;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .menu-text {
        flex: 1;
        font-size: 28rpx;
        color: #333;
      }
    }
  }
}

// 退出登录按钮
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
  
  &:active {
    background-color: #f9f9f9;
  }
}
</style> 