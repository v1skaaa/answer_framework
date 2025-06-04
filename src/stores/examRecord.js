import { defineStore } from 'pinia';
import { ref } from 'vue';
import { getStudentExamRecords } from '@/api/exam';

export const useExamRecordStore = defineStore('examRecord', () => {
  const examRecordList = ref([]);
  const loading = ref(false);
  const error = ref(null);

  const fetchExamRecords = async (studentId) => {
    loading.value = true;
    error.value = null;
    try {
      const res = await getStudentExamRecords(studentId);
      if (res.flag === '1' && res.result) {
        examRecordList.value = res.result.map(item => ({
           recordId: item.examRecord.recordId,
           paperId: item.examRecord.paperId,
           startTime: item.examRecord.startTime,
           endTime: item.examRecord.endTime,
           status: item.examRecord.status,
           totalScore: item.paperQues ? item.paperQues.totalScore : 'N/A',
           paperName: item.paperQues ? item.paperQues.paperName : '未知试卷名称',
        }));
        console.log('Fetched exam records:', examRecordList.value);
      } else {
        error.value = res.msg || '获取考试记录失败';
        console.error('获取考试记录失败:', res.msg);
        uni.showToast({
          title: error.value,
          icon: 'none'
        });
      }
    } catch (err) {
      error.value = '加载考试记录异常';
      console.error('加载考试记录异常:', err);
       uni.showToast({
          title: error.value,
          icon: 'none'
        });
    } finally {
      loading.value = false;
    }
  };

  return {
    examRecordList,
    loading,
    error,
    fetchExamRecords,
  };
}); 