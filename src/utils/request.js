import axios from 'axios';
import { useUserStore } from '@/stores/user'; // Import the user store

// 创建两个 Axios 实例，分别用于不同的服务
const authService = axios.create({
  baseURL: 'http://172.16.99.91:8001',
  timeout: 5000, // 请求超时时间
});

const apiService = axios.create({
  baseURL: 'http://172.16.99.91:8002',
  timeout: 5000,
});

// Flag to prevent multiple token refresh requests
let isRefreshing = false;
// Queue of requests to be retried after token refresh
let requests = [];

// Helper function to process the queue with the new token
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
    const userStore = useUserStore(); // Get store instance

    // Check if the error is a 401 Unauthorized and it's not a refresh token request itself
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Mark this request as retried to avoid infinite loops

      if (!isRefreshing) {
        isRefreshing = true;
        try {
          await userStore.refreshAccessToken(); // Call the refresh token action
          processQueue(null, userStore.accessToken); // Process all pending requests with the new token
          return authService(originalRequest); // Retry the original request
        } catch (refreshError) {
          processQueue(refreshError); // Propagate refresh error to all pending requests
          // The refreshAccessToken action already redirects to login on failure
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      } else {
        // If a refresh is already in progress, queue the current request
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

    // Unified handling for network errors, timeouts, etc.
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