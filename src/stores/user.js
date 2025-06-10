import { defineStore } from 'pinia';
import { login, logout, refreshToken } from '@/api/user';

export const useUserStore = defineStore('user', {
  state: () => ({
    accessToken: uni.getStorageSync('accessToken') || '',
    refreshToken: uni.getStorageSync('refreshToken') || '',
    nickname: uni.getStorageSync('nickname') || '',
    username: uni.getStorageSync('username') || '',
    avatar: uni.getStorageSync('avatar') || null,
    permissions: uni.getStorageSync('permissions') || [],
    roles: uni.getStorageSync('roles') || [],
    expires: uni.getStorageSync('expires') || '',
    id:uni.getStorageSync('id') || ''
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
          expires,
          id
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
        this.id = id;

        // 存储到本地
        uni.setStorageSync('accessToken', accessToken);
        uni.setStorageSync('refreshToken', refreshToken);
        uni.setStorageSync('permissions', permissions);
        uni.setStorageSync('roles', roles);
        uni.setStorageSync('nickname', nickname);
        uni.setStorageSync('username', username);
        uni.setStorageSync('avatar', avatar);
        uni.setStorageSync('expires', expires);
        uni.setStorageSync('id', id);
        
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

    // 刷新 Token
    async refreshAccessToken() {
        try {
            const currentRefreshToken = this.refreshToken;
            if (!currentRefreshToken) {
                console.warn('No refreshToken found, cannot refresh token.');
                // 如果没有 refreshToken，直接视为刷新失败，清空状态并跳转登录
                this.resetState();
                uni.redirectTo({ url: '/pages/login/index' }); // 假设您的登录页路径是 /pages/login/index
                return Promise.reject(new Error('No refreshToken available.'));
            }

            const res = await refreshToken({ refreshToken: currentRefreshToken });

            const {
                accessToken,
                refreshToken: newRefreshToken, // 重命名以避免冲突
                expires,
                nickname,
                username,
                avatar,
                permissions,
                roles,
                id
            } = res.result;

            // 更新到状态中
            this.accessToken = accessToken;
            this.refreshToken = newRefreshToken;
            this.expires = expires;
            this.nickname = nickname;
            this.username = username;
            this.avatar = avatar;
            this.permissions = permissions;
            this.roles = roles;
            this.id = id;

            // 存储到本地
            uni.setStorageSync('accessToken', accessToken);
            uni.setStorageSync('refreshToken', newRefreshToken);
            uni.setStorageSync('expires', expires);
            uni.setStorageSync('nickname', nickname);
            uni.setStorageSync('username', username);
            uni.setStorageSync('avatar', avatar);
            uni.setStorageSync('permissions', permissions);
            uni.setStorageSync('roles', roles);
            uni.setStorageSync('id', id);

            console.log('Token refreshed successfully. New expires:', this.expires);
            return res; // 返回新的响应，可能包含新的用户信息
        } catch (error) {
            console.error('Failed to refresh token:', error);
            // 刷新失败，通常意味着 refreshToken 也过期或无效，需要重新登录
            this.resetState();
            uni.redirectTo({ url: '/pages/login/index' }); // 假设您的登录页路径是 /pages/login/index
            return Promise.reject(error);
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
      this.id = '';
      
      // 清除本地存储
      uni.removeStorageSync('accessToken');
      uni.removeStorageSync('refreshToken');
      uni.removeStorageSync('permissions');
      uni.removeStorageSync('roles');
      uni.removeStorageSync('nickname');
      uni.removeStorageSync('username');
      uni.removeStorageSync('avatar');
      uni.removeStorageSync('expires');
      uni.removeStorageSync('id');
    }
  }
}); 