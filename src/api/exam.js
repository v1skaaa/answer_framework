import { apiService } from '@/utils/request'; // Import apiService

// 获取试卷题目列表
export function getQuestionList(sourceId) {
  return apiService({
    url: '/api/tenant/exam/question/list',
    method: 'get',
    params: { sourceId }
  });
}

// You can add other exam related API functions here later 