<template>
  <view class="container">
    <view class="header">
      <view class="search-bar">
        <uni-icons type="search" size="18" color="#999"></uni-icons>
        <input type="text" v-model="keyword" placeholder="搜索题目" @confirm="searchQuestions" />
      </view>
    </view>
    
    <view class="filter-bar">
      <view class="filter-item" :class="{ active: currentTag === 'all' }" @click="setTag('all')">全部</view>
      <view class="filter-item" :class="{ active: currentTag === 'easy' }" @click="setTag('easy')">简单</view>
      <view class="filter-item" :class="{ active: currentTag === 'medium' }" @click="setTag('medium')">中等</view>
      <view class="filter-item" :class="{ active: currentTag === 'hard' }" @click="setTag('hard')">困难</view>
    </view>
    
    <view class="question-list">
      <view class="question-item" v-for="(item, index) in questionList" :key="index" @click="goToDetail(item)">
        <view class="question-info">
          <view class="question-title">{{ item.title }}</view>
          <view class="question-tags">
            <view class="tag" :class="'tag-' + item.level">{{ item.levelText }}</view>
            <view class="tag tag-type">{{ item.type }}</view>
          </view>
        </view>
        <view class="question-status" :class="{ 'status-done': item.isDone }">
          <uni-icons v-if="item.isDone" type="checkbox-filled" size="22" color="#4caf50"></uni-icons>
          <uni-icons v-else type="circle" size="22" color="#ddd"></uni-icons>
        </view>
      </view>
    </view>
    
    <view class="empty-state" v-if="questionList.length === 0">
      <image src="/static/images/empty.png" mode="aspectFit"></image>
      <text>暂无相关题目</text>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const keyword = ref('');
const currentTag = ref('all');
const questionList = ref([]);

// 模拟题目数据
const mockQuestions = [
  {
    id: 1,
    title: '集合的含义及表示',
    level: 'easy',
    levelText: '简单',
    type: '集合',
    isDone: true
  },
  {
    id: 2,
    title: '空间几何体',
    level: 'medium',
    levelText: '中等',
    type: '立体几何初步',
    isDone: false
  },
  {
    id: 3,
    title: '向量的线性运算',
    level: 'medium',
    levelText: '中等',
    type: '平面向量',
    isDone: true
  },
  {
    id: 4,
    title: '基本算法语句',
    level: 'easy',
    levelText: '简单',
    type: '算法初步',
    isDone: false
  },
  {
    id: 5,
    title: '柯西不等式',
    level: 'hard',
    levelText: '困难',
    type: '不等式选讲',
    isDone: false
  }
];

const setTag = (tag) => {
  currentTag.value = tag;
  filterQuestions();
};

const filterQuestions = () => {
  if (currentTag.value === 'all') {
    questionList.value = mockQuestions.filter(q => 
      q.title.toLowerCase().includes(keyword.value.toLowerCase())
    );
    return;
  }
  
  questionList.value = mockQuestions.filter(q => 
    q.level === currentTag.value && 
    q.title.toLowerCase().includes(keyword.value.toLowerCase())
  );
};

const searchQuestions = () => {
  filterQuestions();
};

const goToDetail = (item) => {
  uni.navigateTo({
    url: `/pages/question/detail?id=${item.id}`
  });
};

onMounted(() => {
  // 加载题目列表
  filterQuestions();
});
</script>

<style lang="scss">
.container {
  padding: 20rpx;
  background-color: #f8f8f8;
  min-height: 100vh;
}

.header {
  padding: 0 10rpx;
  margin-bottom: 20rpx;
  
  .search-bar {
    display: flex;
    align-items: center;
    background-color: #fff;
    border-radius: 40rpx;
    padding: 10rpx 20rpx;
    
    uni-icons {
      margin-right: 10rpx;
    }
    
    input {
      flex: 1;
      height: 60rpx;
      font-size: 28rpx;
    }
  }
}

.filter-bar {
  display: flex;
  margin-bottom: 20rpx;
  background-color: #fff;
  border-radius: 10rpx;
  overflow: hidden;
  
  .filter-item {
    flex: 1;
    height: 80rpx;
    line-height: 80rpx;
    text-align: center;
    font-size: 28rpx;
    color: #666;
    position: relative;
    
    &.active {
      color: #a6c0fe;
      font-weight: bold;
      
      &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 40rpx;
        height: 4rpx;
        background-color: #a6c0fe;
        border-radius: 2rpx;
      }
    }
  }
}

.question-list {
  .question-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #fff;
    border-radius: 15rpx;
    padding: 30rpx;
    margin-bottom: 20rpx;
    box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
    
    .question-info {
      flex: 1;
      
      .question-title {
        font-size: 30rpx;
        color: #333;
        margin-bottom: 15rpx;
        font-weight: 500;
      }
      
      .question-tags {
        display: flex;
        
        .tag {
          font-size: 22rpx;
          padding: 4rpx 12rpx;
          border-radius: 6rpx;
          margin-right: 10rpx;
          
          &.tag-easy {
            background-color: #e8f5e9;
            color: #4caf50;
          }
          
          &.tag-medium {
            background-color: #fff8e1;
            color: #ffc107;
          }
          
          &.tag-hard {
            background-color: #ffebee;
            color: #f44336;
          }
          
          &.tag-type {
            background-color: #e3f2fd;
            color: #2196f3;
          }
        }
      }
    }
    
    .question-status {
      margin-left: 20rpx;
      
      &.status-done {
        color: #4caf50;
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