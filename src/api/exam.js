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


// 获取学生考试记录
export function getStudentExamRecords(studentId) {
  return apiService.get('/api/tenant/exam/student-exams', {
    params: {
      studentId: studentId
    }
  });
}

// 根据考试记录ID获取详细考试信息
export const getExamDetails = (recordId) => {
  return apiService({
    url: `/api/tenant/exam/exam-details`,
    method: 'get',
    params: { recordId }
  });
};

// 获取每日推题列表
export function getPapersPushList(studentId) {
  return apiService({
    url: '/api/tenant/exam/papers-push',
    method: 'get',
    params: {
      studentId: studentId
    }
  });
}

// 检查是否可以参加考试
export function checkExamAttempts(studentId, pushId) {
  return apiService({
    url: '/api/tenant/exam/check-exam-attempts',
    method: 'get',
    params: {
      studentId,
      pushId
    }
  });
}

// You can add other exam related API functions here later 