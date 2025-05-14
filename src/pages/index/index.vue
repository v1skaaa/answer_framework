<template>
  <view class="container">
    <!-- 头部数据统计 -->
    <view class="stats-section">
      <view class="stats-card">
        <view class="stats-item">
          <text class="stats-label">坚持天数</text>
          <text class="stats-value">7</text>
        </view>
        <view class="divider"></view>
        <view class="stats-item">
          <text class="stats-label">刷题数</text>
          <text class="stats-value">42</text>
        </view>
      </view>
    </view>
    
    <!-- 题目类型卡片 -->
    <view class="card-section">
      <view class="card-grid">
        <view class="card-item" @click="navigateTo('/pages/basic/index')">
          <view class="card-content">
            <text class="card-title">基础题</text>
          </view>
        </view>
        
        <view class="card-item" @click="navigateTo('/pages/enhanced/index')">
          <view class="card-content">
            <text class="card-title">强化题</text>
          </view>
        </view>
        
        <view class="card-item" @click="navigateTo('/pages/mock/index')">
          <view class="card-content">
            <text class="card-title">模拟题库</text>
          </view>
        </view>
        
        <view class="card-item" @click="navigateTo('')">
          <view class="card-content">
            <text class="card-title">...</text>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 每日推荐 -->
    <view class="recommend-section">
      <view class="section-title">
        <text>每日推荐</text>
      </view>
      <view class="recommend-list">
        <view class="recommend-item" v-for="(item, index) in recommendList" :key="index" @click="goToQuestion(item)">
          <view class="recommend-content">
            <text class="recommend-title">{{item.title}}</text>
            <text class="recommend-desc">{{item.desc}}</text>
          </view>
          <view class="recommend-right">
            <text class="recommend-difficulty" :class="'difficulty-' + item.level">{{item.levelText}}</text>
            <uni-icons type="right" size="16" color="#999"></uni-icons>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 最近做题 -->
    <view class="recent-section">
      <view class="section-title">
        <text>最近做题</text>
      </view>
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
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';

// 模拟推荐题目数据
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

onMounted(() => {
  // 检查是否登录
  const token = uni.getStorageSync('token');
  if (!token) {
    uni.redirectTo({
      url: '/pages/login/index'
    });
  }
  
  // 这里可以请求真实数据
  // loadStats();
  // loadRecommendList();
  // loadRecentList();
});
</script>

<style lang="scss">
.container {
  padding: 20rpx;
  background-color: #f8f8f8;
  min-height: 100vh;
}

// 统计区域样式
.stats-section {
  margin-bottom: 30rpx;
  
  .stats-card {
    background-color: #fff;
    border-radius: 20rpx;
    display: flex;
    padding: 30rpx 0;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
    
    .stats-item {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      
      .stats-label {
        font-size: 28rpx;
        color: #666;
        margin-bottom: 15rpx;
      }
      
      .stats-value {
        font-size: 40rpx;
        font-weight: bold;
        color: #333;
      }
    }
    
    .divider {
      width: 2rpx;
      background-color: #eee;
      height: 60rpx;
      align-self: center;
    }
  }
}

// 卡片网格样式
.card-section {
  margin-bottom: 30rpx;
  
  .card-grid {
    display: flex;
    flex-wrap: wrap;
    margin: 0 -10rpx;
    
    .card-item {
      width: calc(50% - 20rpx);
      margin: 10rpx;
      height: 180rpx;
      background: linear-gradient(135deg, #a6c0fe, #c2a8fd);
      border-radius: 20rpx;
      overflow: hidden;
      box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
      
      &:nth-child(2n) {
        background: linear-gradient(135deg, #70c1ff, #5a9cff);
      }
      
      &:nth-child(3) {
        background: linear-gradient(135deg, #ffaa7f, #ff7eb3);
      }
      
      &:nth-child(4) {
        background: linear-gradient(135deg, #7ed4fd, #57a8ff);
      }
      
      .card-content {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        height: 100%;
        padding: 20rpx;
        
        .card-title {
          font-size: 34rpx;
          font-weight: bold;
          color: #fff;
          text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.1);
        }
      }
    }
  }
}

// 推荐区域样式
.recommend-section, .recent-section {
  background-color: #fff;
  border-radius: 20rpx;
  padding: 20rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
  
  .section-title {
    font-size: 32rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 20rpx;
    padding-left: 20rpx;
    border-left: 8rpx solid #a6c0fe;
  }
}

.recommend-list {
  .recommend-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20rpx 0;
    border-bottom: 1px solid #f5f5f5;
    
    &:last-child {
      border-bottom: none;
    }
    
    .recommend-content {
      flex: 1;
      padding-right: 20rpx;
      
      .recommend-title {
        font-size: 28rpx;
        color: #333;
        margin-bottom: 10rpx;
        font-weight: 500;
      }
      
      .recommend-desc {
        font-size: 24rpx;
        color: #999;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 1;
        overflow: hidden;
      }
    }
    
    .recommend-right {
      display: flex;
      align-items: center;
      
      .recommend-difficulty {
        font-size: 24rpx;
        padding: 4rpx 10rpx;
        border-radius: 10rpx;
        margin-right: 10rpx;
        
        &.difficulty-easy {
          background-color: #e8f5e9;
          color: #4caf50;
        }
        
        &.difficulty-medium {
          background-color: #fff8e1;
          color: #ffc107;
        }
        
        &.difficulty-hard {
          background-color: #ffebee;
          color: #f44336;
        }
      }
    }
  }
}

.recent-list {
  .recent-item {
    padding: 20rpx 0;
    border-bottom: 1px solid #f5f5f5;
    
    &:last-child {
      border-bottom: none;
    }
    
    .recent-content {
      .recent-title {
        font-size: 28rpx;
        color: #333;
        margin-bottom: 10rpx;
        font-weight: 500;
      }
      
      .recent-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        
        .recent-time {
          font-size: 24rpx;
          color: #999;
        }
        
        .recent-status {
          font-size: 24rpx;
          
          &.status-right {
            color: #4caf50;
          }
          
          &.status-wrong {
            color: #f44336;
          }
        }
      }
    }
  }
}
</style>
