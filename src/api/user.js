import { authService, apiService } from '@/utils/request';

// 用户登录 - 使用认证服务
export function login(data) {
  return authService({
    url: '/api/auth/tenant/login',
    method: 'post',
    data: {
      name: data.username,
      pwd: data.password
    },
    headers: {
      'X-Tenant-ID': data.tenantId
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

// 刷新Token - 使用认证服务
export function refreshToken(data) {
  return authService({
    url: '/api/auth/tenant/refreshToken',
    method: 'post',
    data // 直接传递包含 refreshToken 的对象
  });
}

// 获取用户详细信息
export function getUserInfoById(studentId) {
  return apiService({
    url: `/api/tenant/exam/profile/student`,
    method: 'get',
    params: {
      studentId
    }
  });
} 