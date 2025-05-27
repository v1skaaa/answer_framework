import axios from 'axios';

// 创建 Axios 实例
const service = axios.create({
  // TODO: 根据实际后端接口地址修改 baseURL
  baseURL: process.env.NODE_ENV === 'development' ? '/api' : 'https://your.production.api.com',
  timeout: 5000, // 请求超时时间
});

// 请求拦截器
service.interceptors.request.use(
  config => {
    // 在发送请求前做些什么
    // 例如：可以在这里加上 token
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers['Authorization'] = 'Bearer ' + token;
    // }
    return config;
  },
  error => {
    // 对请求错误做些什么
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
service.interceptors.response.use(
  response => {
    // 对响应数据做些什么
    // 例如：可以直接返回 data，或者根据后端的返回结构进行处理
    const res = response.data;
    
    // TODO: 根据后端的业务状态码判断请求是否成功，并进行统一处理
    // if (res.code !== 200) {
    //   console.error('Response Error:', res.message);
    //   // 这里可以根据不同的错误码进行不同的处理，比如弹窗提示、跳转登录页等
    //   return Promise.reject(new Error(res.message || 'Error'));
    // } else {
       return res; // 直接返回数据部分
    // }
  },
  error => {
    // 对响应错误做些什么
    console.error('Response Error:', error.message);
    // 这里可以统一处理网络错误、超时等问题
    return Promise.reject(error);
  }
);

export default service; 