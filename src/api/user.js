import { authService, apiService } from '@/utils/request';

// 用户登录 - 使用认证服务
export function login(data) {
  return authService({
    url: '/api/auth/tenant/login',
    method: 'post',
    data: {
      name: data.username,
      pwd: data.password
    }
  });
}

// 获取用户信息 - 使用API服务
export function getUserInfo() {
  return apiService({
    url: '/api/tenant/private/user/getUserInfoById',
    method: 'get'
  });
}

// 获取用户统计数据 - 使用API服务
export function getUserStats() {
  return apiService({
    url: '/api/user/stats',
    method: 'get'
  });
}

// 退出登录 - 使用认证服务
export function logout() {
  return authService({
    url: '/api/auth/tenant/logout',
    method: 'post'
  });
} 