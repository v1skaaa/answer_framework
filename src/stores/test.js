import { defineStore } from 'pinia';
import { getPaperTypes, getPapersByType } from '@/api/test';

export const useTestStore = defineStore('test', {
  state: () => ({
    paperTypes: [], // 存储试卷类型列表
    currentType: null, // 当前选中的试卷类型
    paperList: [], // 存储试卷列表
    loading: false, // 控制加载状态
    error: null // 存储错误信息
  }),

  getters: {
    // 获取排序后的试卷类型列表
    sortedPaperTypes: (state) => {
      return [...state.paperTypes].sort((a, b) => a.sortOrder - b.sortOrder);
    },
    
    // 根据 typeId 获取试卷类型
    getTypeById: (state) => (typeId) => {
      return state.paperTypes.find(type => type.typeId === typeId);
    }
  },

  actions: {
    // 获取试卷类型列表
    async fetchPaperTypes() {
      try {
        this.loading = true;
        this.error = null;
        const res = await getPaperTypes();
        if (res.flag === '1' && res.result) {
          this.paperTypes = res.result;
        } else {
          throw new Error(res.msg || '获取试卷类型失败');
        }
      } catch (error) {
        console.error('获取试卷类型失败:', error);
        this.error = error.message || '获取试卷类型失败';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // 获取试卷列表
    async fetchPaperList(typeId) {
      try {
        this.loading = true;
        this.error = null;
        const res = await getPapersByType(typeId);
        if (res.flag === '1' && res.result) {
          this.paperList = res.result.map(item => ({
            id: item.paperId,
            title: item.paperName,
            totalScore: item.totalScore,
            typeId: item.typeId
          }));
        } else {
          throw new Error(res.msg || '获取试卷列表失败');
        }
      } catch (error) {
        console.error('获取试卷列表失败:', error);
        this.error = error.message || '获取试卷列表失败';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // 设置当前选中的试卷类型
    setCurrentType(type) {
      this.currentType = type;
      // 同时存储到本地
      if (type) {
        uni.setStorageSync('currentPaperType', type);
      } else {
        uni.removeStorageSync('currentPaperType');
      }
    },

    // 从本地存储恢复当前选中的试卷类型
    restoreCurrentType() {
      const storedType = uni.getStorageSync('currentPaperType');
      if (storedType) {
        this.currentType = storedType;
      }
    }
  }
}); 