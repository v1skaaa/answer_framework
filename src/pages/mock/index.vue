<template>
  <view class="container">
    <view class="header">
      <view class="title-bar">
        <text class="title">模拟题库</text>
        <text class="subtitle">模拟真实考试环境，提升应试能力</text>
      </view>
    </view>
    
    <view class="mock-list">
      <view class="mock-item" v-for="(item, index) in mockExams" :key="index" @click="goToMock(item)">
        <view class="mock-info">
          <text class="mock-title">{{ item.title }}</text>
          <view class="mock-tags">
            <text class="tag tag-count">{{ item.questionCount }}题</text>
            <text class="tag tag-time">{{ item.timeLimit }}分钟</text>
          </view>
          <text class="mock-desc">{{ item.description }}</text>
        </view>
        <view class="mock-status">
          <text :class="['status-text', 'status-' + item.status]">{{ getStatusText(item.status) }}</text>
          <uni-icons type="right" size="20" color="#ccc"></uni-icons>
        </view>
      </view>
    </view>
    
    <view class="history-section" v-if="historyExams.length > 0">
      <view class="section-title">
        <text>历史考试记录</text>
      </view>
      
      <view class="history-list">
        <view class="history-item" v-for="(item, index) in historyExams" :key="index" @click="viewHistory(item)">
          <view class="history-info">
            <text class="history-title">{{ item.title }}</text>
            <text class="history-time">{{ item.date }}</text>
          </view>
          <view class="history-score">
            <view class="score-circle" :class="getScoreClass(item.score)">
              <text class="score-text">{{ item.score }}分</text>
            </view>
          </view>
        </view>
      </view>
    </view>
    
    <view class="empty-state" v-if="mockExams.length === 0">
      <image src="/static/images/empty.png" mode="aspectFit"></image>
      <text>暂无模拟考试题目</text>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';

// 模拟考试列表
const mockExams = ref([
  {
    id: 201,
    title: '2022年普通高等学校招生全国统一考试（广东卷）',
    questionCount: 22,
    timeLimit: 90,
    description: '本试卷难度4.7，总分150分',
    status: 'not_started' // not_started, in_progress, completed
  },
  {
    id: 202,
    title: '2021-2022学年人教版高二导数在研究函数中的应用专项练习（一）',
    questionCount: 20,
    timeLimit: 90,
    description: '本试卷难度5.3，总分120分',
    status: 'in_progress'
  },
  {
    id: 203,
    title: '2021届广东省深圳实验学校高三11月月考试题：理数',
    questionCount: 22,
    timeLimit: 120,
    description: '本试卷难度5.2，总分150分',
    status: 'completed'
  }
]);

// 历史考试记录
const historyExams = ref([
  {
    id: 101,
    title: '2021届“全国八省联考”临门一卷：理数',
    date: '2023-05-10',
    score: 97
  },
  {
    id: 102,
    title: '2022届武汉市高三5月供题',
    date: '2023-04-22',
    score: 104
  },
  {
    id: 103,
    title: '2023届广东衡水高三5月卫冕联考：数学',
    date: '2023-04-15',
    score: 91
  }
]);

// 获取状态文本
const getStatusText = (status) => {
  switch(status) {
    case 'not_started':
      return '未开始';
    case 'in_progress':
      return '进行中';
    case 'completed':
      return '已完成';
    default:
      return '';
  }
};

// 获取分数等级样式
const getScoreClass = (score) => {
  if (score >= 90) return 'score-excellent';
  if (score >= 75) return 'score-good';
  if (score >= 60) return 'score-pass';
  return 'score-fail';
};

// 进入模拟考试
const goToMock = (item) => {
  if (item.status === 'in_progress') {
    uni.showModal({
      title: '继续考试',
      content: '您有一场未完成的考试，是否继续？',
      success: (res) => {
        if (res.confirm) {
          uni.navigateTo({
            url: `/pages/mock/exam?id=${item.id}&continue=true`
          });
        }
      }
    });
    return;
  }
  
  if (item.status === 'completed') {
    uni.showModal({
      title: '重新考试',
      content: '您已完成该考试，是否重新开始？',
      success: (res) => {
        if (res.confirm) {
          uni.navigateTo({
            url: `/pages/mock/exam?id=${item.id}&restart=true`
          });
        }
      }
    });
    return;
  }
  
  uni.navigateTo({
    url: `/pages/mock/exam?id=${item.id}`
  });
};

// 查看历史考试
const viewHistory = (item) => {
  uni.navigateTo({
    url: `/pages/mock/result?id=${item.id}`
  });
};

onMounted(() => {
  // 可以在这里加载真实数据
});
</script>

<style lang="scss">
.container {
  padding: 20rpx;
  background-color: #f8f8f8;
  min-height: 100vh;
}

.header {
  margin-bottom: 30rpx;
  
  .title-bar {
    padding: 20rpx 10rpx;
    
    .title {
      font-size: 36rpx;
      font-weight: bold;
      color: #333;
      margin-bottom: 10rpx;
      display: block;
    }
    
    .subtitle {
      font-size: 24rpx;
      color: #999;
    }
  }
}

.mock-list {
  .mock-item {
    background-color: #fff;
    border-radius: 15rpx;
    padding: 30rpx;
    margin-bottom: 20rpx;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
    
    .mock-info {
      flex: 1;
      padding-right: 20rpx;
      
      .mock-title {
        font-size: 32rpx;
        font-weight: bold;
        color: #333;
        margin-bottom: 15rpx;
      }
      
      .mock-tags {
        display: flex;
        margin-bottom: 15rpx;
        
        .tag {
          font-size: 22rpx;
          padding: 4rpx 15rpx;
          border-radius: 20rpx;
          margin-right: 10rpx;
          
          &.tag-count {
            background-color: #e3f2fd;
            color: #2196f3;
          }
          
          &.tag-time {
            background-color: #e8f5e9;
            color: #4caf50;
          }
        }
      }
      
      .mock-desc {
        font-size: 24rpx;
        color: #666;
        line-height: 1.5;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
        overflow: hidden;
      }
    }
    
    .mock-status {
      display: flex;
      align-items: center;
      
      .status-text {
        font-size: 26rpx;
        margin-right: 10rpx;
        
        &.status-not_started {
          color: #2196f3;
        }
        
        &.status-in_progress {
          color: #ff9800;
        }
        
        &.status-completed {
          color: #4caf50;
        }
      }
    }
  }
}

.history-section {
  margin-top: 40rpx;
  
  .section-title {
    font-size: 32rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 20rpx;
    padding-left: 20rpx;
    border-left: 8rpx solid #a6c0fe;
  }
  
  .history-list {
    .history-item {
      background-color: #fff;
      border-radius: 15rpx;
      padding: 25rpx 30rpx;
      margin-bottom: 20rpx;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
      
      .history-info {
        .history-title {
          font-size: 28rpx;
          color: #333;
          margin-bottom: 10rpx;
          display: block;
        }
        
        .history-time {
          font-size: 24rpx;
          color: #999;
        }
      }
      
      .history-score {
        .score-circle {
          width: 90rpx;
          height: 90rpx;
          border-radius: 50%;
          display: flex;
          justify-content: center;
          align-items: center;
          
          &.score-excellent {
            background-color: #e8f5e9;
            border: 2rpx solid #4caf50;
            
            .score-text {
              color: #4caf50;
            }
          }
          
          &.score-good {
            background-color: #fff8e1;
            border: 2rpx solid #ffc107;
            
            .score-text {
              color: #ffc107;
            }
          }
          
          &.score-pass {
            background-color: #e3f2fd;
            border: 2rpx solid #2196f3;
            
            .score-text {
              color: #2196f3;
            }
          }
          
          &.score-fail {
            background-color: #ffebee;
            border: 2rpx solid #f44336;
            
            .score-text {
              color: #f44336;
            }
          }
          
          .score-text {
            font-size: 24rpx;
            font-weight: bold;
          }
        }
      }
    }
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 100rpx 0;
  
  image {
    width: 200rpx;
    height: 200rpx;
    margin-bottom: 20rpx;
  }
  
  text {
    font-size: 28rpx;
    color: #999;
  }
}
</style> 