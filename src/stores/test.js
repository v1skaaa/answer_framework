import { defineStore } from 'pinia';
import { getPaperSources } from '@/api/test';

export const useTestStore = defineStore('test', {
  state: () => ({
    paperList: [],// 存储试卷列表数据
    loading: false,// 控制加载状态（如显示 Loading 动画）
    error: null// 存储错误信息（如接口报错）
  }),

  getters: {
    getPaperById: (state) => (id) => {
      return state.paperList.find(paper => paper.id === id);
    }
  },

  actions: {
    async fetchPaperList() {
      try {
        this.loading = true;
        this.error = null;
        const res = await getPaperSources();
        if (res.flag === '1' && res.result) {
          this.paperList = res.result.map(item => ({
            id: item.sourceId,
            title: item.sourceName,
            type: item.sourceType,
            description: item.sourceDescription
          }));
        }
      } catch (error) {
        console.error('获取试卷列表失败:', error);
        this.error = error.message || '获取试卷列表失败';
        throw error;
      } finally {
        this.loading = false;
      }
    }
  }
}); 