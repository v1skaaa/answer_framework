<template>
  <view class="login-container">
    <view class="login-card">
      <view class="login-header">
        <text class="welcome-text">欢迎回来</text>
        <text class="login-tip">请登录您的账号</text>
      </view>
      
      <view class="form-item">
        <text class="label">用户名</text>
        <view class="input-wrapper" :class="{'active': usernameFocus}">
          <input 
            type="text" 
            v-model="username" 
            placeholder="请输入用户名" 
            @focus="usernameFocus = true" 
            @blur="usernameFocus = false" 
          />
          <view class="icon-wrapper">
            <uni-icons type="person" size="22" color="#a6c0fe"></uni-icons>
          </view>
        </view>
      </view>
      
      <view class="form-item">
        <text class="label">密码</text>
        <view class="input-wrapper" :class="{'active': passwordFocus}">
          <input 
            type="password" 
            v-model="password" 
            placeholder="请输入密码"
            @focus="passwordFocus = true" 
            @blur="passwordFocus = false" 
          />
          <view class="icon-wrapper">
            <uni-icons type="locked" size="22" color="#a6c0fe"></uni-icons>
          </view>
        </view>
      </view>
      
      <view class="remember-wrapper">
        <checkbox-group @change="rememberChange">
          <label class="remember-label">
            <checkbox :checked="rememberMe" style="transform:scale(0.7)" color="#a6c0fe" />
            <text>记住我</text>
          </label>
        </checkbox-group>
        <text class="forget-password" @click="forgotPassword">忘记密码?</text>
      </view>
      
      <button class="login-button" @click="handleLogin" :disabled="loading" hover-class="button-hover">
        <text v-if="!loading">登 录</text>
        <text v-else>登录中...</text>
      </button>
      
      <view class="register-tip">
        <text>还没有账号？</text>
        <text class="register-link" @click="goToRegister">立即注册</text>
      </view>
    </view>

    <!-- 底部装饰元素 -->
    <view class="bottom-wave"></view>
  </view>
</template>

<script setup>
import { ref } from 'vue';

const username = ref('');
const password = ref('');
const rememberMe = ref(false);
const loading = ref(false);
const usernameFocus = ref(false);
const passwordFocus = ref(false);

// 模拟API服务
const api = {
  login(username, password) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // 模拟成功登录，实际项目中应使用真实API接口
        if (username && password) {
          resolve({
            code: 200,
            message: '登录成功',
            data: {
              token: 'mock_token_' + Date.now(),
              user: {
                id: 1,
                username: username,
                nickname: '用户' + username
              }
            }
          });
        } else {
          reject({
            code: 400,
            message: '用户名或密码错误'
          });
        }
      }, 1000);
    });
  }
};

const rememberChange = (e) => {
  rememberMe.value = e.detail.value.length > 0;
};

const handleLogin = async () => {
  if (!username.value || !password.value) {
    uni.showToast({
      title: '请输入用户名和密码',
      icon: 'none'
    });
    return;
  }
  
  try {
    loading.value = true;
    uni.showLoading({
      title: '登录中...'
    });
    
    const res = await api.login(username.value, password.value);
    
    // 如果设置了记住我，则保存用户信息到本地存储
    if (rememberMe.value) {
      uni.setStorageSync('userInfo', {
        username: username.value,
        rememberMe: true
      });
    } else {
      uni.removeStorageSync('userInfo');
    }
    
    // 保存登录凭证
    uni.setStorageSync('token', res.data.token);
    
    uni.showToast({
      title: res.message,
      icon: 'success'
    });
    
    // 延迟跳转到首页
    setTimeout(() => {
      uni.switchTab({
        url: '/pages/index/index'
      });
    }, 1500);
  } catch (error) {
    uni.showToast({
      title: error.message || '登录失败，请重试',
      icon: 'none'
    });
  } finally {
    uni.hideLoading();
    loading.value = false;
  }
};

const forgotPassword = () => {
  uni.showToast({
    title: '忘记密码功能开发中',
    icon: 'none'
  });
};

const goToRegister = () => {
  uni.navigateTo({
    url: '/pages/register/index'
  });
};

// 页面加载时，检查是否存在之前记住的账号
const checkRememberedAccount = () => {
  const userInfo = uni.getStorageSync('userInfo');
  if (userInfo && userInfo.rememberMe) {
    username.value = userInfo.username;
    rememberMe.value = true;
  }
};

// 调用检查函数
checkRememberedAccount();
</script>

<style lang="scss">
.login-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #a6c0fe, #c2a8fd);
  padding: 0 30rpx;
  position: relative;
  overflow: hidden;
  
  .login-card {
    width: 100%;
    background-color: rgba(255, 255, 255, 0.92);
    border-radius: 30rpx;
    padding: 50rpx 40rpx;
    box-shadow: 0 15rpx 30rpx rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(20px);
    position: relative;
    z-index: 2;
    
    .login-header {
      margin-bottom: 50rpx;
      text-align: center;
      
      .welcome-text {
        display: block;
        font-size: 48rpx;
        font-weight: bold;
        color: #333;
        margin-bottom: 15rpx;
      }
      
      .login-tip {
        display: block;
        font-size: 28rpx;
        color: #666;
      }
    }
    
    .form-item {
      margin-bottom: 35rpx;
      
      .label {
        display: block;
        font-size: 28rpx;
        color: #333;
        margin-bottom: 12rpx;
      }
      
      .input-wrapper {
        display: flex;
        align-items: center;
        border: 1.5px solid #e6e6e6;
        border-radius: 45rpx;
        padding: 0 30rpx;
        height: 90rpx;
        background-color: #fff;
        transition: all 0.3s;
        
        &.active {
          border-color: #a6c0fe;
          box-shadow: 0 0 12rpx rgba(166, 192, 254, 0.4);
          transform: translateY(-2rpx);
        }
        
        input {
          flex: 1;
          height: 90rpx;
          font-size: 28rpx;
          border: none;
          background: transparent;
        }
        
        .icon-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 50rpx;
          height: 50rpx;
          margin-left: 10rpx;
        }
      }
    }
    
    .remember-wrapper {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 40rpx;
      
      .remember-label {
        display: flex;
        align-items: center;
        
        text {
          font-size: 26rpx;
          color: #666;
        }
      }
      
      .forget-password {
        font-size: 26rpx;
        color: #a6c0fe;
        transition: all 0.3s;
        
        &:active {
          opacity: 0.7;
        }
      }
    }
    
    .login-button {
      width: 100%;
      height: 90rpx;
      line-height: 90rpx;
      background: linear-gradient(to right, #a6c0fe, #c2a8fd);
      color: white;
      font-size: 32rpx;
      border-radius: 45rpx;
      margin: 15rpx 0 40rpx;
      border: none;
      box-shadow: 0 8rpx 20rpx rgba(166, 192, 254, 0.4);
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
      
      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(to right, rgba(255,255,255,0.1), rgba(255,255,255,0.2));
        transform: translateY(-100%);
        transition: transform 0.3s;
        border-radius: 45rpx;
      }
      
      &:active::before,
      &.button-hover::before {
        transform: translateY(0);
      }
      
      &:disabled {
        opacity: 0.7;
        background: linear-gradient(to right, #c6d6f8, #dbc9fc);
      }
    }
    
    .register-tip {
      text-align: center;
      font-size: 26rpx;
      color: #666;
      
      .register-link {
        color: #a6c0fe;
        margin-left: 10rpx;
        transition: all 0.3s;
        
        &:active {
          opacity: 0.7;
        }
      }
    }
  }
  
  .bottom-wave {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 150rpx;
    background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320'%3E%3Cpath fill='%23ffffff' fill-opacity='0.3' d='M0,224L60,213.3C120,203,240,181,360,176C480,171,600,181,720,197.3C840,213,960,235,1080,229.3C1200,224,1320,192,1380,176L1440,160L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z'%3E%3C/path%3E%3C/svg%3E") repeat-x;
    background-size: 100% 100%;
    z-index: 1;
    opacity: 0.7;
  }
}
</style> 