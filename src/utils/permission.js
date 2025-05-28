import { useUserStore } from '@/stores/user';

// 不需要登录就可以访问的页面
const whiteList = [
  '/pages/login/index',
  '/pages/register/index'
];

// 页面跳转拦截
uni.addInterceptor('navigateTo', {
  invoke(e) {
    return handlePermission(e.url);
  }
});

uni.addInterceptor('redirectTo', {
  invoke(e) {
    return handlePermission(e.url);
  }
});

uni.addInterceptor('reLaunch', {
  invoke(e) {
    return handlePermission(e.url);
  }
});

uni.addInterceptor('switchTab', {
  invoke(e) {
    return handlePermission(e.url);
  }
});

// 处理权限
function handlePermission(url) {
  const userStore = useUserStore();
  const token = userStore.accessToken;
  
  // 获取页面路径（去除参数）
  const path = url.split('?')[0];
  
  // 白名单直接放行
  if (whiteList.includes(path)) {
    return true;
  }
  
  // 未登录跳转到登录页
  if (!token) {
    uni.showToast({
      title: '请先登录',
      icon: 'none'
    });
    
    setTimeout(() => {
      uni.reLaunch({
        url: '/pages/login/index'
      });
    }, 1500);
    
    return false;
  }
  
  return true;
} 