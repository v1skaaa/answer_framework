<template>
  <view class="qimo-container" :style="{ paddingTop: containerPaddingTop } ">
    <view ref="headerBar" class="header-bar" :style="{ height: headerHeight, paddingTop: statusBarHeight + 'px' }">
      <view class="left-section">
        <view class="back-button" @click="goBack">
          <uni-icons type="left" size="24" color="#333"></uni-icons>
        </view>
      </view>
      <view class="page-title">期末考试</view>
    </view>

    <view ref="filterBar" class="filter-bar">
      <view class="filter-item" @click="openRegionSelect">
        <text class="filter-text" :class="{'selected-filter': selectedRegion !== '全部'}">{{ selectedRegion === '全部' ? '地区' : selectedRegion }}</text>
        <uni-icons :type="showRegionSelect ? 'top' : 'bottom'" size="14" color="#333"></uni-icons>
      </view>
      <view class="filter-item" @click="openGradeSelect">
         <text class="filter-text" :class="{'selected-filter': selectedGrade !== '全部'}">{{ selectedGrade === '全部' ? '年级' : selectedGrade }}</text>
         <uni-icons :type="showGradeSelect ? 'top' : 'bottom'" size="14" color="#333"></uni-icons>
      </view>
    </view>

    <view class="paper-list">
      <view class="paper-item" v-for="(item, index) in filteredPaperList" :key="index" @click="goToPaperDetail(item)">
        <view class="paper-info">
          <text class="paper-title">{{ item.year }}-{{ item.semester }}学年{{ item.context }}期末考试: {{ item.subject }}</text>
          <text class="paper-questions">共{{ item.questions }}道题</text>
        </view>
        <view class="paper-status">
          <text :class="['status-button', 'status-' + item.status]">{{ item.statusText }}</text>
        </view>
      </view>
       <view v-if="filteredPaperList.length === 0" class="no-data">暂无符合条件的试卷</view>
    </view>

    <!-- Region Selection Overlay -->
    <view class="select-overlay" v-if="showRegionSelect" :style="{ top: overlayTop + 'px' }" @click="closeRegionSelect">
        <scroll-view class="select-list" scroll-y @click.stop>
            <view class="select-item" @click="selectRegion('全部')">
                <text>全部地区</text>
                <uni-icons v-if="selectedRegion === '全部'" type="checkmarkempty" size="20" color="#007aff"></uni-icons>
            </view>
            <view class="select-item" v-for="(region, index) in regions.filter(r => r !== '全部')" :key="index" @click="selectRegion(region)">
                <text>{{ region }}</text>
                <uni-icons v-if="selectedRegion === region" type="checkmarkempty" size="20" color="#007aff"></uni-icons>
            </view>
        </scroll-view>
    </view>

     <!-- Grade Selection Overlay -->
    <view class="select-overlay" v-if="showGradeSelect" :style="{ top: overlayTop + 'px' }" @click="closeGradeSelect">
        <scroll-view class="select-list" scroll-y @click.stop>
             <view class="select-item" @click="selectGrade('全部')">
                <text>全部年级</text>
                 <uni-icons v-if="selectedGrade === '全部'" type="checkmarkempty" size="20" color="#007aff"></uni-icons>
            </view>
            <view class="select-item" v-for="(grade, index) in grades.filter(g => g !== '全部')" :key="index" @click="selectGrade(grade)">
                <text>{{ grade }}</text>
                <uni-icons v-if="selectedGrade === grade" type="checkmarkempty" size="20" color="#007aff"></uni-icons>
            </view>
        </scroll-view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
// uni-icons will be automatically imported via easycom

// 获取胶囊按钮位置信息
const menuButtonHeight = ref(0);
const menuButtonTop = ref(0);
// 添加状态栏高度的计算
const systemInfo = uni.getSystemInfoSync();
const statusBarHeight = systemInfo.statusBarHeight;

// 计算头部总高度
const headerHeight = computed(() => {
  // #ifdef MP-WEIXIN
  return menuButtonTop.value + menuButtonHeight.value + 'px'; // 小程序端：胶囊顶部到屏幕顶部的距离 + 胶囊高度
  // #endif
  // #ifdef H5
  return (statusBarHeight + 44) + 'px'; // H5端：状态栏高度 + 标准导航栏高度44px
  // #endif
  return '0px'; // Default
});

// 计算内容区域的顶部内边距，增加额外空间
const containerPaddingTop = computed(() => {
   const extraSpace = 20; // 额外增加的像素值
   // #ifdef MP-WEIXIN
  return menuButtonTop.value + menuButtonHeight.value + extraSpace + 'px'; // 小程序端：头部高度 + 额外空间
  // #endif
  // #ifdef H5
  return (statusBarHeight + 44 + extraSpace) + 'px'; // H5端：头部高度 + 额外空间
  // #endif
  return '0px'; // Default
});

// 计算遮罩层位置 (需要考虑固定的header高度)
const overlayTop = computed(() => {
  // 在固定头部的情况下，遮罩层的top应该是headerHeight的值
  // 或者获取headerBar元素的bottom位置
   let calculatedTop = 0;
  // #ifdef MP-WEIXIN
   calculatedTop = menuButtonTop.value + menuButtonHeight.value;
   // #endif
   // #ifdef H5
   calculatedTop = statusBarHeight + 44;
   // #endif

  // 我们还需要获取 filter-bar 的高度，但这里我们直接计算固定头部的高度作为overlay的起始位置
  // 更精确的做法是在mounted后获取headerBar的bottom或者filterBar的top
  // 这里先用计算出的headerHeight值作为估算

  // Note: Getting the actual filterBar top after layout is more reliable
  // This computed property might not be immediately accurate before render

  return calculatedTop;

});

onMounted(() => {
  // #ifdef MP-WEIXIN
  const menuButtonInfo = uni.getMenuButtonBoundingClientRect();
  menuButtonHeight.value = menuButtonInfo.height;
  menuButtonTop.value = menuButtonInfo.top;
  // #endif

  // 挂载后获取filterBar的top位置，用于精确定位overlay
  uni.createSelectorQuery().select('.filter-bar').boundingClientRect(filterRect => {
    if (filterRect) {
      overlayTop.value = filterRect.top;
    }
  }).exec();
});


// 模拟试卷数据
const paperList = ref([
  {
    id: 1,
    year: 2020,
    semester: '下',
    context: '广东省五校高一',
    subject: '数学',
    questions: 21,
    status: 'not-finished',
    statusText: '未完成',
    province: '广东',
    grade: '高一'
  },
  {
    id: 2,
    year: 2021,
    semester: '下',
    context: '湖北省武汉市三校高一',
    subject: '数学',
    questions: 21,
    status: 'not-started',
    statusText: '未做',
    province: '湖北',
    grade: '高一'
  },
    {
    id: 3,
    year: 2022,
    semester: '下',
    context: '广西省百色市八校高二',
    subject: '数学',
    questions: 21,
    status: 'finished',
    statusText: '已完成',
    province: '广西',
    grade: '高二'
  },
    {
    id: 4,
    year: 2022,
    semester: '上',
    context: '广东省实验中学高三',
    subject: '物理',
    questions: 20,
    status: 'not-started',
    statusText: '未做',
    province: '广东',
    grade: '高三'
  }
]);

// Filter options
const regions = ref(['全部', '广东', '湖北', '广西']); // Example provinces
const grades = ref(['全部', '高一', '高二', '高三']);

// Selected filters
const selectedRegion = ref('全部');
const selectedGrade = ref('全部');

// Overlay visibility state
const showRegionSelect = ref(false);
const showGradeSelect = ref(false);

// Dynamic overlay top position
// const overlayTop = ref(0); // Moved calculation logic above

// Filtered list based on selections
const filteredPaperList = computed(() => {
  return paperList.value.filter(item => {
    const regionMatch = selectedRegion.value === '全部' || item.province === selectedRegion.value;
    const gradeMatch = selectedGrade.value === '全部' || item.grade === selectedGrade.value;
    return regionMatch && gradeMatch;
  });
});

// Handlers for filter selection
const openRegionSelect = () => {
  showRegionSelect.value = true;
  showGradeSelect.value = false; // Close grade select if open
};
const closeRegionSelect = () => { showRegionSelect.value = false; };
const selectRegion = (region) => {
  selectedRegion.value = region;
  closeRegionSelect();
};

const openGradeSelect = () => {
  showGradeSelect.value = true;
  showRegionSelect.value = false; // Close region select if open
};
const closeGradeSelect = () => { showGradeSelect.value = false; };
const selectGrade = (grade) => {
  selectedGrade.value = grade;
  closeGradeSelect();
};

// 跳转到试卷详情页
const goToPaperDetail = (item) => {
  console.log('goToPaperDetail called with item:', item);
  // TODO: Implement actual navigation to paper detail page
  // uni.navigateTo({ url: `/pages/test/paperDetail?id=${item.id}` });

  console.log('Attempting to navigate to /pages/exam/intro/index');
  // 使用 uni.navigateTo 跳转到试卷介绍页面，并通过 eventChannel 传递数据
  uni.navigateTo({
    url: '/pages/exam/intro/index',
    success: function(res) {
      console.log('Navigation success');
      // 通过 eventChannel 向新页面发送数据
      res.eventChannel.emit('acceptPaperData', { paper: item });
      console.log('Event emitted: acceptPaperData with paper data', item);
    },
    fail: function(err) {
      console.error('Navigation failed:', err);
    },
    complete: function() {
      console.log('Navigation complete');
    }
  });
};

// Method to go back to the previous page
const goBack = () => {
  uni.navigateBack();
};
</script>

<style lang="scss">
/* Remove the :root block as we are not using CSS variables in this way anymore */
/* :root { ... } */

.qimo-container {
  padding: 0 20rpx 20rpx 20rpx;
  background: linear-gradient(135deg, #f8f8ff 0%, #e0e7ff 100%);
  min-height: 100vh;
  box-sizing: border-box;

  /* padding-top is applied via :style */
}

.status-bar-and-header-placeholder {
    height: calc(var(--status-bar-height) + 88rpx); /* Status bar + standard nav bar height */
    background-color: #f8f8f8; /* White background */
    width: 100%;
}

.header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20rpx; /* Adjust horizontal padding */
  width: 100%;
  box-sizing: border-box;
  background: linear-gradient(135deg, #f8f8ff 0%, #e0e7ff 100%);
  margin-top: 0; /* Should be 0 for fixed positioning */

  position: fixed; /* Fixed at the top */
  top: 0;
  left: 0;
  right: 0;
  z-index: 100; /* Ensure it's above other content */

  /* height and padding-top are applied via :style */
}

.left-section,
.right-section,
.back-button,
.page-title {
    display: flex;
    align-items: center;
    justify-content: center; /* Horizontally center for title */
    height: 100%; /* Take full height of header-bar */
}

.page-title {
  font-size: 36rpx;
  font-weight: bold;
  flex: 1;
  text-align: center; /* Keep text-align for broader compatibility */
  margin: 0;
  color: #333;
}

.back-button {
    width: 60rpx;
    cursor: pointer;
}

.filter-bar {
    display: flex;
    justify-content: space-around;
    align-items: center;
    margin-bottom: 20rpx;
    padding: 15rpx 0;
    background-color: #fff;
    border-radius: 8rpx;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
    /* Ensure no margin-top is applied here */
    margin-top: 0; /* Should not have margin-top when container has padding-top */
}

.filter-item {
    display: flex;
    align-items: center;
    cursor: pointer;
}

.filter-text {
    font-size: 28rpx;
    color: #333;
    margin-right: 5rpx; // Space between text and icon

    &.selected-filter {
        color: #007aff; // Highlight selected filter text
    }
}

.paper-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx; // Space between paper items
}

.paper-item {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;

  &:active {
    transform: scale(0.98);
    box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.1);
  }
}

.paper-info {
  flex: 1;
  margin-right: 20rpx;

  .paper-title {
    font-size: 28rpx;
    font-weight: bold;
    color: #333;
    display: block;
    margin-bottom: 8rpx;
  }

  .paper-subtitle {
    font-size: 24rpx;
    color: #666;
    display: block;
    margin-bottom: 4rpx;
  }

  .paper-questions {
    font-size: 24rpx;
    color: #888;
  }
}

.paper-status {
  .status-button {
    font-size: 24rpx;
    padding: 8rpx 16rpx;
    border-radius: 12rpx;
    
    &.status-not-finished {
      background-color: #ffecb3; /* Light orange */
      color: #ff9800; /* Orange */
    }

    &.status-not-started {
      background-color: #e0e0e0; /* Light gray */
      color: #757575; /* Gray */
    }

    &.status-finished {
      background-color: #c8e6c9; /* Light green */
      color: #4caf50; /* Green */
    }
  }
}

.no-data {
    text-align: center;
    color: #999;
    margin-top: 40rpx;
}

.select-overlay {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5); // Semi-transparent background
    display: flex;
    justify-content: center;
    align-items: flex-start; // Align to top
    z-index: 1000; // Ensure it's above other content
    /* top position is applied via :style */
}

.select-list {
    width: 100%;
    background-color: #fff;
    padding: 0 20rpx; // Horizontal padding
    box-sizing: border-box;
    max-height: 60vh;
    /* overflow-y: auto; // Enable scrolling */
}

.select-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 25rpx 0; // Vertical padding
    border-bottom: 1rpx solid #eee; // Divider line
    font-size: 32rpx;
    color: #333;
    cursor: pointer;

    &:last-child {
        border-bottom: none;
    }
}
</style> 