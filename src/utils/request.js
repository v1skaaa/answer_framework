import axios from 'axios';

// 创建两个 Axios 实例，分别用于不同的服务
const authService = axios.create({
  baseURL: 'http://172.16.99.32:8001',
  timeout: 5000, // 请求超时时间
});

const apiService = axios.create({
  baseURL: 'http://172.16.99.32:8002',
  timeout: 5000,
});

// 请求拦截器 - 用于认证服务
authService.interceptors.request.use(
  config => {
    // 从本地存储获取 token
    const token = uni.getStorageSync('accessToken');
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
  error => {
    // 对响应错误做些什么
    console.error('Auth Response Error:', error);
    // 这里可以统一处理网络错误、超时等问题
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
  error => {
    console.error('API Response Error:', error);
    uni.showToast({
      title: error.message || '网络错误',
      icon: 'none'
    });
    return Promise.reject(error);
  }
);

// 导出两个服务实例
export { authService, apiService }; 