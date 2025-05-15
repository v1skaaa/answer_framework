<template>
  <view class="container">
    <view class="header">
      <view class="search-bar">
        <uni-icons type="search" size="18" color="#999"></uni-icons>
        <input type="text" v-model="keyword" placeholder="搜索强化题目" @confirm="searchQuestions" />
      </view>
    </view>
    
    <view class="filter-bar">
      <view class="filter-item" :class="{ active: currentTag === 'all' }" @click="setTag('all')">全部</view>
      <view class="filter-item" :class="{ active: currentTag === 'algorithm' }" @click="setTag('algorithm')">算法</view>
      <view class="filter-item" :class="{ active: currentTag === 'data-structure' }" @click="setTag('data-structure')">数据结构</view>
      <view class="filter-item" :class="{ active: currentTag === 'pattern' }" @click="setTag('pattern')">设计模式</view>
    </view>
  
    <view class="question-list">
      <view class="question-item" v-for="(item, index) in questionList" :key="index" @click="goToDetail(item)">
        <view class="question-info">
          <view class="question-title">{{ item.title }}</view>
          <view class="question-tags">
            <view class="tag" :class="'tag-' + item.level">{{ item.levelText }}</view>
            <view class="tag tag-category">{{ item.category }}</view>
          </view>
          <view class="question-desc">
            <LaTeX v-if="item.hasLatex" :formula="item.description" :displayMode="false"/>
            <text v-else>{{ item.description }}</text>
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
import LaTeX from '@/components/LaTeX.vue';

const keyword = ref('');
const currentTag = ref('all');
const questionList = ref([]);

// 模拟强化题目数据
const mockQuestions = [
  {
    id: 101,
    title: '和与差的三角函数公式',
    level: 'medium',
    levelText: '中等',
    category: '三角恒等变换',
    categoryValue: 'algorithm',
    description: '\\sin(\\alpha \\pm \\beta) = \\sin\\alpha\\cos\\beta \\pm \\cos\\alpha\\sin\\beta',
    hasLatex: true,
    isDone: false
  },
  {
    id: 102,
    title: '积化和差公式推导',
    level: 'hard',
    levelText: '困难',
    category: '数据结构',
    categoryValue: 'data-structure',
    description: 'z = \\sqrt 2 (\\cos 45^\\circ  + {\\rm{i}}\\cos 225^\\circ )',
    hasLatex: true,
    isDone: true
  },
  {
    id: 103,
    title: '辅助角公式求解',
    level: 'medium',
    levelText: '中等',
    category: '设计模式',
    categoryValue: 'pattern',
    description: 'a\\sin\\theta + b\\cos\\theta = \\sqrt{a^2+b^2}\\sin(\\theta+\\arctan\\frac{b}{a})',
    hasLatex: true,
    isDone: false
  },
  {
    id: 104,
    title: '半角公式应用',
    level: 'medium',
    levelText: '中等',
    category: '算法',
    categoryValue: 'algorithm',
    description: '\\sin^2\\frac{\\theta}{2} = \\frac{1-\\cos\\theta}{2}, \\cos^2\\frac{\\theta}{2} = \\frac{1+\\cos\\theta}{2}',
    hasLatex: true,
    isDone: false
  },
  {
    id: 105,
    title: '万能公式证明',
    level: 'hard',
    levelText: '困难',
    category: '设计模式',
    categoryValue: 'pattern',
    description: '\\sin\\alpha = \\frac{2\\tan\\frac{\\alpha}{2}}{1+\\tan^2\\frac{\\alpha}{2}}',
    hasLatex: true,
    isDone: true
  },
  {
    id: 106,
    title: '复杂积分计算',
    level: 'hard',
    levelText: '困难',
    category: '高等数学',
    categoryValue: 'algorithm',
    description: '\\int_{0}^{\\pi} \\frac{1}{a + b\\cos x} dx = \\frac{\\pi}{\\sqrt{a^2 - b^2}}, (a > |b| > 0) ',
    hasLatex: true,
    isDone: false
  },
  {
    id: 107,
    title: '复杂积分计算',
    level: 'hard',
    levelText: '困难',
    category: '高等数学',
    categoryValue: 'algorithm',
    description: 'M = \\left\\{ {\\left. {\\left( {x,y} \\right)} \\right|y = {x^2} + 3x} \\right\\}，N = \\left\\{ {\\left. x \\right|y = {x^2} + 3x} \\right\\}',
    hasLatex: true,
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
    q.categoryValue === currentTag.value && 
    q.title.toLowerCase().includes(keyword.value.toLowerCase())
  );
};

const searchQuestions = () => {
  filterQuestions();
};

const goToDetail = (item) => {
  uni.navigateTo({
    url: `/pages/question/detail?id=${item.id}&type=enhanced`
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
    align-items: flex-start;
    background-color: #fff;
    border-radius: 15rpx;
    padding: 30rpx;
    margin-bottom: 20rpx;
    box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
    
    .question-info {
      flex: 1;
      padding-right: 20rpx;
      
      .question-title {
        font-size: 30rpx;
        color: #333;
        margin-bottom: 12rpx;
        font-weight: 500;
      }
      
      .question-tags {
        display: flex;
        margin-bottom: 12rpx;
        
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
          
          &.tag-category {
            background-color: #e3f2fd;
            color: #2196f3;
          }
        }
      }
      
      .question-desc {
        font-size: 26rpx;
        color: #666;
        line-height: 1.4;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
        overflow: hidden;
        padding: 8rpx 0;
      }
    }
    
    .question-status {
      margin-top: 6rpx;
      padding: 0 10rpx;
      
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