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

// 退出登录 - 使用认证服务
export function logout() {
  return authService({
    url: '/api/auth/tenant/logout',
    method: 'post'
  });
}

// 获取用户详细信息
export function getUserInfoById(userId) {
  return authService({
    url: `/api/tenant/private/user/getUserInfoById`,
    method: 'get',
    params: {
      userId
    }
  });
} 