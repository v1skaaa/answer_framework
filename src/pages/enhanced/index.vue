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
            <MathJax 
              v-if="item.hasLatex" 
              :formula="item.description" 
              :displayMode="false" 
              :scale="0.75"
            />
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
import MathJax from '@/components/MathJax.vue';

const keyword = ref('');
const currentTag = ref('all');
const questionList = ref([]);

// 模拟强化题目数据
const mockQuestions = [
  {
    id: 101,
    title: '复数的三角形式',
    level: 'medium',
    levelText: '中等',
    category: '复变函数',
    categoryValue: 'algorithm',
    description: 'z = r(\\cos\\theta + i\\sin\\theta) = re^{i\\theta}',
    hasLatex: true,
    isDone: false
  },
  {
    id: 102,
    title: '欧拉公式推导',
    level: 'hard',
    levelText: '困难',
    category: '复变函数',
    categoryValue: 'data-structure',
    description: 'e^{ix} = \\cos x + i\\sin x',
    hasLatex: true,
    isDone: true
  },
  {
    id: 103,
    title: '傅里叶变换公式',
    level: 'hard',
    levelText: '困难',
    category: '信号分析',
    categoryValue: 'pattern',
    description: 'F(\\omega) = \\int_{-\\infty}^{\\infty} f(t) e^{-i\\omega t} dt',
    hasLatex: true,
    isDone: false
  },
  {
    id: 104,
    title: '拉普拉斯变换',
    level: 'hard',
    levelText: '困难',
    category: '微分方程',
    categoryValue: 'algorithm',
    description: 'F(s) = \\int_{0}^{\\infty} f(t) e^{-st} dt',
    hasLatex: true,
    isDone: false
  },
  {
    id: 105,
    title: '麦克斯韦方程组',
    level: 'hard',
    levelText: '困难',
    category: '电磁学',
    categoryValue: 'pattern',
    description: '\\nabla\\times E=-\\frac{\\partial B}{\\partial t}',
    hasLatex: true,
    isDone: true
  },
  {
    id: 106,
    title: '薛定谔方程',
    level: 'hard',
    levelText: '困难',
    category: '量子力学',
    categoryValue: 'algorithm',
    description: 'i\\hbar\\frac{\\partial}{\\partial t}\\Psi(\\mathbf{r},t) = \\hat H\\Psi(\\mathbf{r},t)',
    hasLatex: true,
    isDone: false
  },
  {
    id: 107,
    title: '爱因斯坦场方程',
    level: 'hard',
    levelText: '困难',
    category: '广义相对论',
    categoryValue: 'algorithm',
    description: 'R_{\\mu\\nu}-\\frac{1}{2}Rg_{\\mu\\nu}=\\frac{8\\pi G}{c^4}T_{\\mu\\nu}',
    hasLatex: true,
    isDone: false
  },
  {
    id: 108,
    title: '统计力学中的配分函数',
    level: 'medium',
    levelText: '中等',
    category: '统计物理',
    categoryValue: 'data-structure',
    description: 'Z = \\sum_i e^{-\\beta E_i}',
    hasLatex: true,
    isDone: true
  },
  {
    id: 109,
    title: '随机测试',
    level: 'medium',
    levelText: '中等',
    category: '随机',
    categoryValue: 'data-structure',
    description: '\\iiint\\limits_{\\Omega} \\left( \\frac{\\partial^2 f}{\\partial x^2} + \\frac{\\partial^2 f}{\\partial y^2} + \\frac{\\partial^2 f}{\\partial z^2} \\right) dV = \\oint_{\\partial \\Omega} \\frac{\\nabla f \\cdot \\mathbf{n}}{\\sqrt{1 + \\left( \\frac{\\partial f}{\\partial x} \\right)^2 + \\left( \\frac{\\partial f}{\\partial y} \\right)^2}} \\, dS',
    hasLatex: true,
    isDone: true
  },
  {
    id: 109,
    title: '随机测试02',
    level: 'medium',
    levelText: '中等',
    category: '随机',
    categoryValue: 'data-structure',
    description: 'I_{2 k+1}=\\frac{(2 k)!!}{(2 k+1)!!}',
    hasLatex: true,
    isDone: true
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
        line-height: 1.5;
        display: flex;
        align-items: center;
        min-height: 50rpx;
        padding: 8rpx 0;
        overflow: hidden;
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