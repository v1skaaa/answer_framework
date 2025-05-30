import { apiService } from '@/utils/request'; // Import apiService

// 获取试卷题目列表
export function getQuestionList(sourceId) {
  return apiService({
    url: '/api/tenant/exam/all/list',
    method: 'get',
    params: { sourceId }
  });
}

// 提交试卷接口
export const submitExamComplete = (data) => {
  console.log('提交试卷请求数据:', data);
  // 使用 apiService 实例调用接口
  return apiService({
    url: '/api/tenant/exam/submit/complete', // 使用相对路径
    method: 'POST',
    data: data,
    // Header和其他配置会由 apiService 的拦截器处理
  });
}

// You can add other exam related API functions here later 