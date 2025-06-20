import axios from 'axios';
import { useUserStore } from '@/stores/user'; // Import the user store

// 打印当前环境信息
console.log('Current Environment:', import.meta.env.MODE);
console.log('Auth Base URL:', import.meta.env.VITE_AUTH_BASE_URL);
console.log('API Base URL:', import.meta.env.VITE_API_BASE_URL);
console.log('Full Auth URL example:', import.meta.env.VITE_AUTH_BASE_URL + '/api/auth/tenant/login');
console.log('Full API URL example:', import.meta.env.VITE_API_BASE_URL + '/api/tenant/exam/all/list');

// 创建认证服务实例
const authService = axios.create({
  baseURL: import.meta.env.VITE_AUTH_BASE_URL,
  timeout: 50000, // 请求超时时间
});

// 创建API服务实例
const apiService = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 50000,
});

// 防止多个令牌刷新请求的标志
let isRefreshing = false;
// 令牌刷新后要重试的请求队列
let requests = [];

// 使用新令牌处理队列的Helper函数
function processQueue(error, token = null) {
  requests.forEach(p => {
    if (error) {
      p.reject(error);
    } else {
      p.resolve(token);
    }
  });
  requests = []; // Clear the queue
}

// 请求拦截器 - 用于认证服务
authService.interceptors.request.use(
  config => {
    const userStore = useUserStore(); // Get the store instance inside the interceptor
    // 从本地存储获取 token
    const token = userStore.accessToken; // Use store's accessToken
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    // 对请求错误做些什么
    console.error('Auth Request Error:', error);
    return Promise.reject(error);
  }
);

// 请求拦截器 - 用于API服务
apiService.interceptors.request.use(
  config => {
    const token = uni.getStorageSync('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    // 自动加 X-Tenant-ID，登录接口除外
    if (!config.url.includes('/auth/tenant/login')) {
      const tenantId = uni.getStorageSync('X-Tenant-ID');
      if (tenantId) {
        config.headers['X-Tenant-ID'] = tenantId;
      }
    }
    return config;
  },
  error => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器 - 用于认证服务
authService.interceptors.response.use(
  response => {
    // 对响应数据做些什么
    const res = response.data;
    
    // 如果是登录接口，记录响应数据
    if (response.config.url.includes('/login')) {
      console.log('登录接口响应数据:', res);
      if (res.result) {
        console.log('登录返回的用户信息:', res.result);
      }
    }
    
    // 根据后端返回的 flag 判断请求是否成功
    if (res.flag === '1') {
      return res;
    } else {
      uni.showToast({
        title: res.msg || '请求失败',
        icon: 'none'
      });
      return Promise.reject(new Error(res.msg || '请求失败'));
    }
  },
  async error => {
    // 对响应错误做些什么
    console.error('Auth Response Error:', error);
    const originalRequest = error.config;
    const userStore = useUserStore(); // 获取存储实例

    // 检查错误是否为401 Unauthorized，并且它本身不是刷新令牌请求
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // 将此请求标记为重试以避免无限循环

      if (!isRefreshing) {
        isRefreshing = true;
        try {
          await userStore.refreshAccessToken(); // 调用刷新令牌操作
          processQueue(null, userStore.accessToken); // 用新令牌处理所有挂起的请求
          return authService(originalRequest); // 重试原始请求
        } catch (refreshError) {
          processQueue(refreshError); // 将刷新错误传播到所有挂起的请求
          // refreshAccessToken操作已经在失败时重定向到登录
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      } else {
        // 如果刷新已经在进行中，则将当前请求排队
        return new Promise((resolve, reject) => {
          requests.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers['Authorization'] = `Bearer ${token}`;
          return authService(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }
    }

    // 统一处理网络错误，超时等。
    uni.showToast({
      title: error.message || '网络错误',
      icon: 'none'
    });
    return Promise.reject(error);
  }
);

// 响应拦截器 - 用于API服务
apiService.interceptors.response.use(
  response => {
    const res = response.data;
    if (res.flag === '1') {
      return res;
    } else {
      uni.showToast({
        title: res.msg || '请求失败',
        icon: 'none'
      });
      return Promise.reject(new Error(res.msg || '请求失败'));
    }
  },
  async error => {
    console.error('API Response Error:', error);
    const originalRequest = error.config;
    const userStore = useUserStore(); // Get store instance

    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;
        try {
          await userStore.refreshAccessToken();
          processQueue(null, userStore.accessToken);
          return apiService(originalRequest); // Retry the original request for apiService
        } catch (refreshError) {
          processQueue(refreshError);
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      } else {
        return new Promise((resolve, reject) => {
          requests.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers['Authorization'] = `Bearer ${token}`;
          return apiService(originalRequest); // Re-send for apiService
        }).catch(err => {
          return Promise.reject(err);
        });
      }
    }

    uni.showToast({
      title: error.message || '网络错误',
      icon: 'none'
    });
    return Promise.reject(error);
  }
);

// 导出两个服务实例
export { authService, apiService }; 