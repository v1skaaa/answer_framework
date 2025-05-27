<template>
  <view class="exam-intro-container" :style="{ paddingTop: containerPaddingTop, paddingBottom: fixedButtonHeight }">
    <!-- 自定义头部 -->
    <view class="header-bar" :style="{ height: headerHeight, paddingTop: statusBarHeight + 'px' }">
      <view class="left-section">
        <view class="back-button" @click="goBack">
          <uni-icons type="left" size="24" color="#333"></uni-icons>
        </view>
      </view>
      <!-- 移除固定头部的试卷名称 -->
      <!-- <view class="page-title">{{ paper.title || '试卷详情' }}</view> -->
      <view class="right-section"></view> <!-- 右侧占位符 -->
    </view>

    <!-- 页面主要内容 -->
    <view class="content">
      <!-- 将试卷名称放在内容区域的顶部 -->
      <view class="paper-title-in-content">{{ paper.title || '试卷详情' }}</view>

      <view class="info-section">
        <text class="info-item">本试卷难度{{ paper.difficulty }}</text>
        <text class="info-item">总分{{ paper.totalScore }}分</text>
      </view>

      <view class="question-breakdown-section">
        <text class="section-title">共分为{{ paper.parts.length }}个部分:</text>
        <view class="breakdown-list">
          <view class="breakdown-item" v-for="(part, index) in paper.parts" :key="index">
            <text class="part-name">{{ part.name }}</text>
            <text class="part-count">{{ part.count }}题</text>
            <text class="part-score">{{ part.score }}分</text>
          </view>
        </view>
      </view>

      <!-- 开始答题按钮不再直接在这里，而是放在固定底部容器中 -->
      <!--
      <view class="button-container">
        <button class="start-button" @click="startExam">开始答题</button>
      </view>
      -->
    </view>

    <!-- Fixed bottom button container -->
    <view class="fixed-bottom-button">
       <view class="button-container">
          <button class="start-button" @click="startExam">开始答题</button>
        </view>
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
import { ref, computed, onMounted, nextTick } from 'vue'; // Import nextTick
// uni-icons will be automatically imported via easycom

// 获取胶囊按钮位置信息和状态栏高度
const menuButtonHeight = ref(0);
const menuButtonTop = ref(0);
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

// 计算内容区域的顶部内边距 (考虑头部高度和额外空间)
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

// 用于存储固定底部按钮容器的高度
const fixedButtonHeight = ref('0px');

// 计算遮罩层位置 (需要考虑固定的header高度)
const overlayTop = computed(() => {
   let calculatedTop = 0;
  // #ifdef MP-WEIXIN
   calculatedTop = menuButtonTop.value + menuButtonHeight.value;
   // #endif
   // #ifdef H5
   calculatedTop = statusBarHeight + 44;
   // #endif
  return calculatedTop;
});

onMounted(() => {
  // #ifdef MP-WEIXIN
  const menuButtonInfo = uni.getMenuButtonBoundingClientRect();
  menuButtonHeight.value = menuButtonInfo.height;
  menuButtonTop.value = menuButtonInfo.top;
  // #endif

  // 挂载后获取filterBar的top位置，用于精确定位overlay (如果filterBar是固定在header下方的)
  // 如果filterBar是随内容滚动的，overlayTop的计算需要调整
  // 这里先保留获取filterBar top的逻辑，但主要依赖headerHeight + extraSpace来计算overlayTop可能更稳定
   uni.createSelectorQuery().select('.filter-bar').boundingClientRect(filterRect => {
    if (filterRect) {
      // overlayTop.value = filterRect.top; // 使用计算出的header底部位置可能更可靠
    }
  }).exec();

   // 在DOM更新后获取固定底部按钮容器的高度
   nextTick(() => {
     uni.createSelectorQuery().select('.fixed-bottom-button').boundingClientRect(rect => {
       if (rect && rect.height) {
         fixedButtonHeight.value = rect.height + 'px';
       }
     }).exec();
   });
});


// 模拟试卷数据（没有接口前的占位数据）
const paper = ref({
  title: '2022年普通高等学校招生全国统一考试 (上海卷) : 数学',
  difficulty: 4.7,
  totalScore: 150,
  parts: [
    { name: '选择题', count: 9, score: 45 },
    { name: '填空题', count: 6, score: 30 },
    { name: '解答题', count: 5, score: 75 },
  ],
  // 可以在这里添加更多试卷相关信息，比如 ID
  id: null,
});

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

// 跳转到试卷详情页（待实现）
const goToPaperDetail = (item) => {
  console.log('Navigate to paper detail for:', item.title);
  // TODO: Implement actual navigation to paper detail page
  // uni.navigateTo({ url: `/pages/test/paperDetail?id=${item.id}` });
};

// Method to go back to the previous page
const goBack = () => {
  uni.navigateBack();
};

// 开始答题按钮点击事件（待实现）
const startExam = () => {
  console.log('开始答题 clicked');
  // TODO: Implement开始答题的逻辑，比如跳转到答题界面，并传递试卷ID等
  // uni.navigateTo({ url: `/pages/test/paperDetail?id=${item.id}` });

  // 使用事件通道传递试卷数据并跳转到答题页面
  uni.navigateTo({
    url: '/pages/exam/answering/index',
    events: {
      // 为答题页面定义一个事件监听器
      acceptPaperData: function(data) {
        console.log('Answering page received data:', data);
        // 在答题页面通过 getOpenerEventChannel() 监听这个事件来接收数据
      }
    },
    success: function (res) {
      // 通过eventChannel向目标页面发送数据
      res.eventChannel.emit('acceptPaperData', { paper: paper.value });
    }
  });
};

// TODO: 从页面参数获取试卷信息，并更新 paper.value
// ... existing code ...

// 移除原先的 onMounted 逻辑，合并到上面的 onMounted 中
/*
onMounted(() => {
  // #ifdef MP-WEIXIN
  const menuButtonInfo = uni.getMenuButtonBoundingClientRect();
  menuButtonHeight.value = menuButtonInfo.height;
  menuButtonTop.value = menuButtonInfo.top;
  // #endif
});
*/

</script>

<style lang="scss">
.exam-intro-container {
  padding: 0 20rpx 20rpx 20rpx;
  background: linear-gradient(135deg, #f8f8ff 0%, #e0e7ff 100%);
  min-height: 100vh;
  box-sizing: border-box;
  /* padding-top and padding-bottom are applied via :style */
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
.right-section { /* 右侧占位符样式 */
    display: flex;
    align-items: center;
     height: 100%; /* Take full height of header-bar */
}

.back-button {
  width: 60rpx;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  height: 100%;
}

.right-section {
  width: 60rpx; /* 右侧占位符宽度 */
}

.content {
  margin-top: 20rpx; /* content内部的顶部间距，与containerPaddingTop结合使用 */
}

.paper-title-in-content {
    font-size: 36rpx; /* 调整字体大小 */
    font-weight: bold;
    color: #333;
    margin-bottom: 30rpx; /* 增加标题下方与其他内容的间距 */
    text-align: center; /* 标题居中 */
}

.info-section {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.info-item {
  font-size: 32rpx;
  color: #333;
  display: block;
  margin-bottom: 20rpx;

  &:last-child {
    margin-bottom: 0;
  }
}

.question-breakdown-section {
   background-color: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.section-title {
  font-size: 34rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
  display: block;
}

.breakdown-list {

}

.breakdown-item {
  display: flex;
  justify-content: space-between;
  font-size: 30rpx;
  color: #555;
  margin-bottom: 15rpx;

   &:last-child {
    margin-bottom: 0;
  }
}

.part-name {
  flex: 1;
}

.part-count {
  width: 120rpx;
  text-align: center;
}

.part-score {
   width: 120rpx;
   text-align: right;
}

.fixed-bottom-button {
    position: fixed; /* Fixed at the bottom */
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 100; /* Ensure it's above other content */
    padding: 20rpx; /* 内边距 */
    box-sizing: border-box; /* 包含内边距和边框在元素宽度内 */
}

.button-container {
  /* 移除margin-top和padding，已经在fixed-bottom-button中处理 */
  margin-top: 0;
  padding: 0;
}

.start-button {
  background-color: #007aff; /* 示例蓝色 */
  color: #fff;
  font-size: 32rpx;
  padding: 15rpx 0;
  border-radius: 50rpx; /* 圆角按钮 */
  text-align: center;
  cursor: pointer;
  transition: opacity 0.2s ease-in-out;
  width: 100%; /* 按钮宽度占满容器 */

  &:active {
    opacity: 0.8;
  }
}

</style> 