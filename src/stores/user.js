import { defineStore } from 'pinia';
import { login, logout } from '@/api/user';

export const useUserStore = defineStore('user', {
  state: () => ({
    accessToken: uni.getStorageSync('accessToken') || '',
    refreshToken: uni.getStorageSync('refreshToken') || '',
    nickname: uni.getStorageSync('nickname') || '',
    username: uni.getStorageSync('username') || '',
    avatar: uni.getStorageSync('avatar') || null,
    permissions: uni.getStorageSync('permissions') || [],
    roles: uni.getStorageSync('roles') || [],
    expires: uni.getStorageSync('expires') || ''
  }),

  getters: {
    isLoggedIn: (state) => !!state.accessToken,
    hasPermission: (state) => (permission) => state.permissions.includes(permission),
    hasRole: (state) => (role) => state.roles.includes(role)
  },

  actions: {
    // 设置 token
    setToken(token) {
      this.accessToken = token;
      uni.setStorageSync('accessToken', token);
    },

    // 设置用户信息
    setUserInfo(userInfo) {
      if (userInfo.username) {
        this.username = userInfo.username;
        uni.setStorageSync('username', userInfo.username);
      }
      if (userInfo.nickname) {
        this.nickname = userInfo.nickname;
        uni.setStorageSync('nickname', userInfo.nickname);
      }
      if (userInfo.avatar) {
        this.avatar = userInfo.avatar;
        uni.setStorageSync('avatar', userInfo.avatar);
      }
    },

    // 登录
    async loginAction(loginData) {
      try {
        const res = await login(loginData);
        const { 
          accessToken, 
          refreshToken, 
          permissions, 
          roles, 
          nickname,
          username,
          avatar,
          expires
        } = res.result;
        
        // 保存到状态中
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.permissions = permissions;
        this.roles = roles;
        this.nickname = nickname;
        this.username = username;
        this.avatar = avatar;
        this.expires = expires;

        // 存储到本地
        uni.setStorageSync('accessToken', accessToken);
        uni.setStorageSync('refreshToken', refreshToken);
        uni.setStorageSync('permissions', permissions);
        uni.setStorageSync('roles', roles);
        uni.setStorageSync('nickname', nickname);
        uni.setStorageSync('username', username);
        uni.setStorageSync('avatar', avatar);
        uni.setStorageSync('expires', expires);
        
        return res;
      } catch (error) {
        throw error;
      }
    },

    // 退出登录
    async logoutAction() {
      try {
        await logout();
        this.resetState();
        return true;
      } catch (error) {
        throw error;
      }
    },

    // 重置状态
    resetState() {
      this.accessToken = '';
      this.refreshToken = '';
      this.nickname = '';
      this.username = '';
      this.avatar = null;
      this.permissions = [];
      this.roles = [];
      this.expires = '';
      
      // 清除本地存储
      uni.removeStorageSync('accessToken');
      uni.removeStorageSync('refreshToken');
      uni.removeStorageSync('permissions');
      uni.removeStorageSync('roles');
      uni.removeStorageSync('nickname');
      uni.removeStorageSync('username');
      uni.removeStorageSync('avatar');
      uni.removeStorageSync('expires');
    }
  }
}); 