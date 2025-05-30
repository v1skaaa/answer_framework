import { apiService } from '@/utils/request';

// 获取试卷来源列表
export function getPaperSources() {
  return apiService({
    url: '/api/tenant/exam/paper-sources',
    method: 'get'
  });
}

// 获取单个试卷来源详情
export function getPaperSourceDetail(sourceId) {
  return apiService({
    url: '/api/tenant/exam/source/info', // 注意这里没有后面的参数，参数通过 params 发送
    method: 'get',
    params: { sourceId }
  });
} 