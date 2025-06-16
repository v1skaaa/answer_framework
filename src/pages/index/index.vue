<template>
  <view class="container">
    <view class="top-section">
      <view class="top-card">
        <view class="top-item">
          <text class="top-label">坚持天数</text>
          <text class="top-desc">您已打卡</text>
          <text class="top-value">17天</text>
        </view>
        <view class="top-item">
          <text class="top-label">考试倒计时</text>
          <text class="top-desc">距离2026年高考还有</text>
          <text class="top-value">{{ gaokaoCountdown }}</text>
        </view>
      </view>
      <view class="middle-card">
        <view class="middle-item exercise" @click="goToExercise">
          <text class="middle-title">刷题练习</text>
          <text class="middle-desc">去巩固一下你学的东西吧</text>
        </view>
        <view class="middle-item test" @click="goToTest">
          <text class="middle-title">在线考试</text>
          <text class="middle-desc">考考你学得怎么样</text>
        </view>
      </view>
    </view>
    <view class="section-title"><view class="bar"></view>优卷智推</view>
    <view class="daily-recommend-card" @click="goToDailyRecommend">
      <view class="card-left">
        <text class="card-title">优卷智推，随师定练于时</text>
        <view class="quick-exam-entry">
          <text class="entry-text">快捷入口</text>
          <uni-icons type="right" size="16" color="#666"></uni-icons>
        </view>
      </view>
      <view class="card-right">
        <image src="/static/boshimao.png" class="illustration"></image>
      </view>
    </view>
    <view class="section-title"><view class="bar"></view>最近做题</view>
    <view class="recent-list">
      <view class="recent-item" v-for="(item, index) in recentList" :key="index" @click="goToQuestion(item)">
        <view class="recent-content">
          <text class="recent-title">{{item.title}}</text>
          <view class="recent-info">
            <text class="recent-time">{{item.time}}</text>
            <text class="recent-status" :class="{ 'status-right': item.status === 'right', 'status-wrong': item.status === 'wrong' }">
              {{item.status === 'right' ? '回答正确' : '回答错误'}}
            </text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';

// 高考倒计时状态
const gaokaoCountdown = ref('计算中...');

const calculateGaokaoCountdown = () => {
  const now = new Date();
  const currentYear = now.getFullYear();

  // 定义今年的高考开始和结束日期
  const gaokaoStartThisYear = new Date(currentYear, 5, 7); // 6月7日 (月份从0开始，所以5代表6月)
  const gaokaoEndThisYear = new Date(currentYear, 5, 9);   // 6月9日

  // 确保日期对象是当日的开始时间，方便比较
  gaokaoStartThisYear.setHours(0, 0, 0, 0);
  gaokaoEndThisYear.setHours(23, 59, 59, 999);

  if (now.getTime() < gaokaoStartThisYear.getTime()) {
    // 情况一：在今年的高考开始前
    const diffTime = gaokaoStartThisYear.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    gaokaoCountdown.value = `${diffDays}天`;
  } else if (now.getTime() >= gaokaoStartThisYear.getTime() && now.getTime() <= gaokaoEndThisYear.getTime()) {
    // 情况二：在高考期间
    gaokaoCountdown.value = '高考中';
  } else {
    // 情况三：在今年的高考结束后，计算到明年的高考
    const gaokaoStartNextYear = new Date(currentYear + 1, 5, 7);
    gaokaoStartNextYear.setHours(0, 0, 0, 0);
    const diffTime = gaokaoStartNextYear.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    gaokaoCountdown.value = `${diffDays}天`;
  }
};

// 模拟推荐题目数据 (REMOVING THIS)
/*
const recommendList = ref([
  {
    id: 1,
    title: '圆锥曲线',
    desc: '这是一道典型的圆锥曲线算法题目，适合初学者学习',
    level: 'easy',
    levelText: '简单'
  },
  {
    id: 2,
    title: '生活中的优化问题',
    desc: '掌握空间向量和立体几何的情景应用题目，考察对其的理解',
    level: 'medium',
    levelText: '中等'
  },
  {
    id: 3,
    title: '数学归纳法',
    desc: '增强推理与证明的能力',
    level: 'hard',
    levelText: '困难'
  }
]);
*/

// 模拟最近做题数据
const recentList = ref([
  {
    id: 101,
    title: '复数的四则运算',
    time: '今天 14:30',
    status: 'right'
  },
  {
    id: 102,
    title: '坐标系与参数方程',
    time: '昨天 18:45',
    status: 'wrong'
  },
  {
    id: 103,
    title: '统计案例',
    time: '前天 09:20',
    status: 'right'
  }
]);

// 页面导航
const navigateTo = (url) => {
  uni.switchTab({
    url: url
  });
};

// 跳转到题目详情页
const goToQuestion = (item) => {
  uni.navigateTo({
    url: `/pages/question/detail?id=${item.id}`
  });
};

const goToExercise = () => {
  uni.switchTab({ url: '/pages/exercise/index' })
}
const goToTest = () => {
  uni.switchTab({ url: '/pages/test/index' })
}

const goToDailyRecommend = () => {
  uni.navigateTo({ url: '/pages/recommend/index' })
}

onMounted(() => {
  // 检查是否登录
  const token = uni.getStorageSync('accessToken');
  if (!token) {
    uni.redirectTo({
      url: '/pages/login/index'
    });
  }
  
  // 这里可以请求真实数据
  // loadStats();
  // loadRecommendList();
  // loadRecentList();

  calculateGaokaoCountdown();
});
</script>

<style lang="scss">
.container {
  padding: 24rpx 20rpx 120rpx 20rpx;
  background: linear-gradient(135deg, #f8f8ff 0%, #e0e7ff 100%);
  min-height: 100vh;
}
.header-title {
  text-align: center;
  font-size: 36rpx;
  font-weight: bold;
  margin: 20rpx 0 30rpx 0;
}
.top-section {
  margin-bottom: 30rpx;
}
.top-card {
  display: flex;
  justify-content: space-between;
  background: linear-gradient(135deg, #a6c0fe 0%, #c2a8fd 100%);
  border-radius: 24rpx;
  padding: 30rpx 0;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 8rpx rgba(166,192,254,0.10);
}
.top-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  border-right: 2rpx solid #eee;
  &:last-child { border-right: none; }
}
.top-label {
  font-size: 28rpx;
  color: #fff;
  font-weight: bold;
  margin-bottom: 8rpx;
}
.top-desc {
  font-size: 22rpx;
  color: #f3f3f3;
  margin-bottom: 8rpx;
}
.top-value {
  font-size: 40rpx;
  color: #fff;
  font-weight: bold;
  text-shadow: 0 2rpx 8rpx #a6c0fe44;
}
.middle-card {
  display: flex;
  justify-content: space-between;
  border-radius: 24rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 8rpx rgba(90,156,255,0.10);
}
.middle-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  padding: 30rpx 0;
  color: #fff;
  font-weight: bold;
  font-size: 28rpx;
}
.middle-item.exercise {
  background: linear-gradient(135deg, #70c1ff 0%, #a6d4f8 100%); /* Adjusted blue gradient */
}
.middle-item.test {
  background: linear-gradient(135deg, #ffaa7f 0%, #ff9ac2 100%); /* Adjusted pink/orange gradient */
}
.middle-title {
  font-size: 28rpx;
  color: #fff;
  font-weight: bold;
  margin-bottom: 8rpx;
}
.middle-desc {
  font-size: 22rpx;
  color: #f3f3f3;
}
.section-title {
  font-size: 28rpx;
  color: #333;
  font-weight: bold;
  margin: 30rpx 0 10rpx 0;
  display: flex;
  align-items: center;
}
.section-title .bar {
  width: 12rpx;
  height: 32rpx;
  background: linear-gradient(135deg, #a6c0fe 0%, #5a9cff 100%);
  border-radius: 8rpx;
  margin-right: 16rpx;
}
.daily-recommend-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg,rgb(255, 254, 254) 0%,rgb(255, 255, 255) 100%); /* Light gradient background */
  border-radius: 20rpx;
  padding: 25rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.06);
}
.card-left {
  display: flex;
  flex-direction: column;
  justify-content: center;
  flex: 1;
}
.card-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 10rpx;
}
.quick-exam-entry {
  display: flex;
  align-items: center;
  font-size: 26rpx;
  color: #666;
  cursor: pointer;
  .entry-text {
    margin-right: 8rpx; 
  }
}
.card-right {
  width: 170rpx; /* Adjust as needed */
  height: 200rpx; /* Adjust as needed */
  display: flex;
  justify-content: flex-end;
  align-items: center;
}
.illustration {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.recent-list {
  background-color: #fff;
  border-radius: 20rpx;
  padding: 0 20rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04);
  .recent-item {
    padding: 20rpx 0;
    border-bottom: 1rpx solid #eee;
    &:last-child { border-bottom: none; }
    .recent-content {
      .recent-title {
        font-size: 28rpx;
        color: #333;
        font-weight: bold;
        margin-bottom: 8rpx;
      }
      .recent-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 24rpx;
        color: #888;
        .recent-time {
          margin-right: 20rpx;
        }
        .recent-status {
          &.status-right { color: #4caf50; }
          &.status-wrong { color: #f44336; }
        }
      }
    }
  }
}
.dot-list {
  display: flex;
  align-items: center;
  margin-bottom: 10rpx;
}
.dot {
  width: 18rpx;
  height: 18rpx;
  border-radius: 50%;
  margin-right: 16rpx;
  background: #e0e0e0;
  transition: background 0.3s;
}
.dot1 {
  background: linear-gradient(135deg, #a6c0fe 0%, #c2a8fd 100%);
}
.dot2 {
  background: linear-gradient(135deg, #ffaa7f 0%, #ff7eb3 100%);
}
.dot:last-child { margin-right: 0; }
</style>
