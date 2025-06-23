import { apiService } from '@/utils/request';


// 获取单个错题的错题推荐
export function getWrongQuestionRecommend(questionId) {
  return apiService({
    url: '/api/tenant/exam/similar/recommend', // 注意这里没有后面的参数，参数通过 params 发送
    method: 'get',
    params: { questionId }
  });
}