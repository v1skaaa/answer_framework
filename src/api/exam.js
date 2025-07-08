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

// 从minio获取图片数据
export const getImageFromMinio = (imagePath) => {
  return apiService({
    url: '/api/tenant/exam/image',
    method: 'get',
    params: { imagePath }
  });
};

// 获取指定时间范围内的错题数量统计
export const getWrongQuestionCount = (studentId, startTime, endTime) => {
  return apiService({
    url: '/api/tenant/exam/wrongQuestion/count',
    method: 'get',
    params: {
      studentId,
      startTime,
      endTime
    }
  });
};

// 获取错题分析详情
export const getWrongQuestionDetails = (studentId, startTime, endTime) => {
  return apiService({
    url: '/api/tenant/exam/wrongQuestion/list',
    method: 'get',
    params: {
      studentId,
      startTime,
      endTime
    }
  });
};

// 获取学生错题知识点分析
export const getWrongQuestionKnowledgePoints = (studentId, startTime, endTime) => {
  return apiService({
    url: '/api/tenant/exam/analysis/wrong-question-knowledge-points',
    method: 'get',
    params: {
      studentId,
      startTime,
      endTime
    }
  });
};

// 获取用户意见反馈列表
export const getUserFeedback = (userId) => {
  return apiService({
    url: '/api/tenant/exam/profile/getFeedback',
    method: 'get',
    params: { userId }
  });
};

// 提交用户意见反馈
export const submitUserFeedback = (userId, content) => {
  return apiService({
    url: '/api/tenant/exam/profile/submitFeedback',
    method: 'post',
    data: { userId, content }
  });
};

// 根据知识点查询学生错题
export const getWrongQuestionsByKnowledgePoint = (studentId, knowledgePointId, startTime, endTime) => {
  return apiService({
    url: '/api/tenant/exam/wrongQuestion/byKnowledgePoint',
    method: 'get',
    params: {
      studentId,
      knowledgePointId,
      startTime,
      endTime
    }
  });
};

// You can add other exam related API functions here later 