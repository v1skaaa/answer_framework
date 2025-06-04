import { apiService } from '@/utils/request';


// 获取单个试卷来源详情
export function getPaperSourceDetail(sourceId) {
  return apiService({
    url: '/api/tenant/exam/source/info', // 注意这里没有后面的参数，参数通过 params 发送
    method: 'get',
    params: { sourceId }
  });
}

// 获取试卷类型列表
export function getPaperTypes() {
  return apiService({
    url: '/api/tenant/exam/paper-types',
    method: 'get'
  });
}

// 根据类型ID获取试卷列表
export function getPapersByType(typeId) {
  return apiService({
    url: '/api/tenant/exam/papers-by-type',
    method: 'get',
    params: { typeId }
  });
} 

