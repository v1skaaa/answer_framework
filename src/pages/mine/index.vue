<template>
  <view class="container">
    <view class="header">
      <image class="avatar" :src="'/static/images/default-avatar.png'" mode="aspectFill"></image>
      <text class="username">{{ userInfo.nickname || userInfo.username }}</text>
    </view>
    <view class="stats-bar">
      <view class="stats-item" @click="navToWrongQuestions">
        <text class="stats-label">错题集</text>
      </view>
      <view class="stats-divider">|</view>
      <view class="stats-item">
        <text class="stats-label">收藏本</text>
      </view>
    </view>
    <view class="menu-group">
      <view class="menu-group-title">通用</view>
      <view class="menu-list">
        <view class="menu-item" @click="goToPersonalDetail">
          <view class="menu-icon"><uni-icons type="person" size="22" color="#a6c0fe"></uni-icons></view>
          <text class="menu-text">个人信息</text>
          <text class="menu-arrow">></text>
        </view>
        <view class="menu-item" @click="navTo('/pages/mine/feedBack/index')">
          <view class="menu-icon"><span class="iconfont icon-yijianfankui01" style="font-size:22px;color:#32ccd7;"></span></view>
          <text class="menu-text">意见反馈</text>
          <text class="menu-arrow">></text>
        </view>
        <!-- 注释掉消息通知
        <view class="menu-item" @click="navTo('/pages/mine/messages')">
          <view class="menu-icon"><uni-icons type="chatboxes" size="22" color="#28b68a"></uni-icons></view>
          <text class="menu-text">消息通知</text>
          <text class="menu-arrow">></text>
        </view>
        -->
      </view>
    </view>
    <view class="menu-group">
      <view class="menu-group-title">学况</view>
      <view class="menu-list">
        <view class="menu-item" @click="navTo('/pages/mine/situation/index')">
          <view class="menu-icon"><span class="iconfont icon-xueqingfenxi" style="font-size:22px;color:#ffaa7f;"></span></view>
          <text class="menu-text">学情分析</text>
          <text class="menu-arrow">></text>
        </view>
      </view>
    </view>
    <view class="menu-group">
      <view class="menu-group-title">考试</view>
      <view class="menu-list">
        <view class="menu-item" @click="navTo('/pages/mine/examRecord/index')">
          <view class="menu-icon"><span class="iconfont icon-kaoshi" style="font-size:22px;color:#a6c0fe;"></span></view>
          <text class="menu-text">考试记录</text>
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
import { useUserDetailStore } from '@/stores/userDetail';
import { getWrongQuestionCount } from '@/api/exam';
import { logout as logoutAPI } from '@/api/user';
import '@/../font_4960231_adxpawzkqii/iconfont.css';

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

// 修改错题集点击事件
const navToWrongQuestions = () => {
  const studentId = uni.getStorageSync('id');
  // 获取当前时间作为结束时间
  const now = new Date();
  now.setMinutes(0);
  now.setSeconds(0);
  now.setMilliseconds(0);
  now.setHours(now.getHours() + 1); // 结束时间+1小时
  const endTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:00:00`;

  // 获取5天前的时间作为开始时间
  const startDate = new Date(now);
  startDate.setDate(now.getDate() - 5);
  const startTime = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')} ${String(startDate.getHours()).padStart(2, '0')}:00:00`;

  // 跳转到错题集页面，使用 encodeURIComponent 编码时间字符串
  uni.navigateTo({
    url: `/pages/mine/wrongQuestions/index?studentId=${studentId}&startTime=${encodeURIComponent(startTime)}&endTime=${encodeURIComponent(endTime)}`
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

const logout = async () => {
  uni.showLoading({ title: '退出中...' });
  try {
    // 调用退出登录接口
    const response = await logoutAPI();
    uni.hideLoading();
    
    if (response && response.flag === '1') {
      // 清除本地存储的用户信息
      uni.removeStorageSync('accessToken');
      uni.removeStorageSync('refreshToken');
      uni.removeStorageSync('username');
      uni.removeStorageSync('nickname');
      uni.removeStorageSync('avatar');
      uni.removeStorageSync('id');
      
      // 提示退出成功
      uni.showToast({
        title: '退出成功',
        icon: 'success',
        duration: 100,
        complete: () => {
          // 跳转到登录页
          setTimeout(() => {
            uni.reLaunch({
              url: '/pages/login/index'
            });
          }, 100);
        }
      });
    } else {
      // 接口调用失败但仍然退出
      console.warn('退出登录接口调用失败，仍然执行本地退出操作');
      handleLocalLogout();
    }
  } catch (error) {
    uni.hideLoading();
    console.error('退出登录失败:', error);
    // 如果接口调用失败，也执行本地退出逻辑
    handleLocalLogout();
  }
};

// 添加本地退出处理函数
const handleLocalLogout = () => {
  // 清除本地存储的用户信息
  uni.removeStorageSync('accessToken');
  uni.removeStorageSync('refreshToken');
  uni.removeStorageSync('username');
  uni.removeStorageSync('nickname');
  uni.removeStorageSync('avatar');
  uni.removeStorageSync('id');
  
  uni.showToast({
    title: '已退出登录',
    icon: 'none',
    duration: 1000,
    complete: () => {
      setTimeout(() => {
        uni.reLaunch({
          url: '/pages/login/index'
        });
      }, 1000);
    } 
  });
};

onMounted(() => {
  // 获取真实用户数据或使用模拟数据
  const token = uni.getStorageSync('accessToken');
  if (!token) {
    uni.redirectTo({
      url: '/pages/login/index'
    });
    return;
  }
  // 这里可以调用API获取用户真实数据
  // getUserInfo();
  // getUserStats();

  // Get nickname from local storage and update userInfo
  const storedNickname = uni.getStorageSync('nickname');
  if (storedNickname) {
    userInfo.value.nickname = storedNickname;
  }
});

const userDetailStore = useUserDetailStore();

const goToPersonalDetail = async () => {
  const studentId = uni.getStorageSync('id');
  if (studentId) {
    await userDetailStore.fetchUserDetail(studentId);
  }
  uni.navigateTo({
    url: '/pages/mine/detail/index'
  });
};
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
  padding: 0;
  margin-bottom: 30rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
  height: 140rpx;
  align-items: center;
}

.stats-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  color: #333;
  width: 40%;
  height: 60rpx;
}

.stats-label {
  font-size: 28rpx;
  color: #333;
  margin-bottom: 0;
  line-height: 60rpx;
}

.stats-divider {
  color: #ccc;
  display: flex;
  align-items: center;
  height: 60rpx;
  width: 10%;
  justify-content: center;
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