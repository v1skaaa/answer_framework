<template>
  <view class="container">
    <!-- 自定义头部（只保留返回按钮） -->
    <view class="header-bar" :style="{ height: headerHeight, paddingTop: statusBarHeight + 'px' }">
      <view class="left-section">
        <view class="back-button" @click="goBack">
          <uni-icons type="left" size="24" color="#333"></uni-icons>
        </view>
      </view>
      <view class="center-section"></view>
      <view class="right-section"></view>
    </view>
    <view class="content" :style="{ paddingTop: headerHeight, paddingBottom: fixedButtonHeight }">
      <view class="main-title">修改密码</view>
      <view class="desc">密码长度在8-20位，应包含数字、大小字母、特殊符号（除空格）的两种或两种以上</view>
      <view class="form-area">
        <view class="username">{{ username }}</view>
        <input class="input" v-model="oldPassword" type="password" placeholder="请输入旧密码" />
        <input class="input" v-model="newPassword" type="password" placeholder="请输入新密码" />
        <input class="input" v-model="confirmPassword" type="password" placeholder="请再次输入新密码" />
      </view>
    </view>
    <!-- 固定底部按钮 -->
    <view class="fixed-bottom-button">
      <button class="submit-btn preview-button" @click="handleSubmit" :disabled="loading">确定</button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { changePassword } from '@/api/exam';
import { logout as logoutAPI } from '@/api/user';

const oldPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const username = ref('');

// 顶部高度相关
const menuButtonHeight = ref(0);
const menuButtonTop = ref(0);
const statusBarHeight = ref(0);
const fixedButtonHeight = ref('100rpx');

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
  return '64px';
});

const loading = ref(false);

const goBack = () => {
  uni.navigateBack();
};

onLoad(() => {
  username.value = uni.getStorageSync('username') || '';
  // 动态获取底部按钮高度，防止被遮挡
  nextTick(() => {
    uni.createSelectorQuery().select('.fixed-bottom-button').boundingClientRect(rect => {
      if (rect && rect.height) {
        fixedButtonHeight.value = rect.height + 'px';
      }
    }).exec();
  });
});

const handleSubmit = async () => {
  if (newPassword.value !== confirmPassword.value) {
    uni.showToast({ title: '两次输入的新密码不一致', icon: 'none' });
    return;
  }
  const studentId = uni.getStorageSync('id');
  if (!studentId) {
    uni.showToast({ title: '未获取到用户ID', icon: 'none' });
    return;
  }
  loading.value = true;
  try {
    const res = await changePassword(studentId, oldPassword.value, newPassword.value);
    
    // 检查修改密码是否成功
    if (res && res.flag === '1') {
      uni.showToast({ 
        title: res.msg || '密码修改成功', 
        icon: 'success',
        duration: 1500,
        complete: () => {
          // 密码修改成功后，调用退出登录接口
          setTimeout(() => {
            handleLogout();
          }, 1500);
        }
      });
    } else {
      uni.showToast({ title: res.msg || '密码修改失败', icon: 'none' });
    }
  } catch (e) {
    let msg = '请求失败';
    if (e && e.response && e.response.data && e.response.data.msg) {
      msg = e.response.data.msg;
    }
    uni.showToast({ title: msg, icon: 'none' });
  } finally {
    loading.value = false;
  }
};

// 退出登录处理函数
const handleLogout = async () => {
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
      
      // 提示退出成功并跳转到登录页
      uni.showModal({
        title: '提示',
        content: '密码已修改\n请重新登录',
        showCancel: false,
        confirmText: '确定',
        success: () => {
          setTimeout(() => {
            uni.reLaunch({
              url: '/pages/login/index'
            });
          }, 500);
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

// 本地退出处理函数
const handleLocalLogout = () => {
  // 清除本地存储的用户信息
  uni.removeStorageSync('accessToken');
  uni.removeStorageSync('refreshToken');
  uni.removeStorageSync('username');
  uni.removeStorageSync('nickname');
  uni.removeStorageSync('avatar');
  uni.removeStorageSync('id');
  
  uni.showModal({
    title: '提示',
    content: '密码已修改\n请重新登录',
    showCancel: false,
    confirmText: '确定',
    success: () => {
      setTimeout(() => {
        uni.reLaunch({
          url: '/pages/login/index'
        });
      }, 500);
    }
  });
};
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8f8ff 0%, #e0e7ff 100%);
  display: flex;
  flex-direction: column;
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
  display: none;
}
.right-section {
  display: flex;
  align-items: center;
  height: 100%;
  width: 60rpx;
}
.content {
  flex: 1;
  width: 100%;
  box-sizing: border-box;
  overflow-y: auto;
  padding: 0 32rpx;
}
.main-title {
  margin-top: 40rpx;
  font-size: 38rpx;
  font-weight: bold;
  color: #222;
  margin-bottom: 18rpx;
}
.desc {
  font-size: 26rpx;
  color: #666;
  margin-bottom: 40rpx;
  line-height: 1.6;
}
.form-area {
  display: flex;
  flex-direction: column;
  gap: 48rpx; // 增大输入框间距
  margin-top: 0;
}
.username {
  font-size: 30rpx;
  color: #333;
  border-bottom: 2rpx solid #ccc;
  padding: 18rpx 0 8rpx 0;
  margin-bottom: 8rpx;
}
.input {
  font-size: 28rpx;
  color: #333;
  border: none;
  border-bottom: 2rpx solid #ccc;
  padding: 18rpx 0 8rpx 0;
  background: transparent;
  outline: none;
}
.input::placeholder {
  color: #bbb;
}
.fixed-bottom-button {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 101;
  padding: 0 32rpx 32rpx 32rpx;
  background: transparent;
  box-sizing: border-box;
}
.submit-btn {
  width: 100%;
  height: 88rpx;
  border-radius: 44rpx;
  font-size: 32rpx;
  font-weight: bold;
  color: #fff;
  background: linear-gradient(135deg, #23cde0 0%, #1e90ff 100%);
  border: none;
  box-shadow: 0 4rpx 12rpx rgba(35, 205, 224, 0.15);
  transition: all 0.2s;
  margin-top: 0;
}
.submit-btn:active {
  opacity: 0.85;
}
</style> 