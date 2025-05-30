import { defineStore } from 'pinia';
import { getUserInfoById } from '@/api/user';

export const useUserDetailStore = defineStore('userDetail', {
  state: () => ({
    userDetail: null,
    loading: false,
    error: null
  }),

  getters: {
    getUserDetail: (state) => state.userDetail,
    isLoading: (state) => state.loading,
    getError: (state) => state.error
  },

  actions: {
    async fetchUserDetail(userId) {
      this.loading = true;
      this.error = null;
      try {
        const response = await getUserInfoById(userId);
        if (response.flag === '1') {
          this.userDetail = response.result;
          console.log('获取到的用户详细信息:', this.userDetail);
        } else {
          throw new Error(response.msg || '获取用户信息失败');
        }
      } catch (error) {
        this.error = error.message;
        console.error('获取用户详细信息失败:', error);
      } finally {
        this.loading = false;
      }
    },

    clearUserDetail() {
      this.userDetail = null;
      this.error = null;
    }
  }
}); 