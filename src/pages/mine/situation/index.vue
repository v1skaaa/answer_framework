<template>
  <view class="container">
    <!-- 自定义头部 -->
    <view class="header-bar" :style="{ height: headerHeight, paddingTop: statusBarHeight + 'px' }">
      <view class="left-section">
        <view class="back-button" @click="goBack">
          <uni-icons type="left" size="24" color="#333"></uni-icons>
        </view>
      </view>
      <view class="center-section">
        <text class="header-title">学情分析</text>
      </view>
      <view class="right-section"></view> <!-- 右侧占位符 -->
    </view>

    <!-- 页面内容区域 -->
    <view class="content" :style="{ paddingTop: headerHeight }">
      <!-- 时间选择器区域 -->
      <view class="date-picker-container">
        <view class="date-pickers-row">
          <view class="date-picker-item">
            <text class="date-label">开始时间</text>
            <picker mode="date" :value="startDate" :start="startDateLimit" :end="endDate || endDateLimit" @change="onStartDateChange" class="picker date-picker">
              <view class="picker-value">{{ startDate || '选择日期' }}</view>
            </picker>
          </view>
          <view class="date-picker-item">
            <text class="date-label">结束时间</text>
            <picker mode="date" :value="endDate" :start="startDate || startDateLimit" :end="endDateLimit" @change="onEndDateChange" class="picker date-picker">
              <view class="picker-value">{{ endDate || '选择日期' }}</view>
            </picker>
          </view>
        </view>
        <!-- 查询按钮 -->
        <view class="search-btn-container">
          <button class="search-btn" @click="handleSearch" :disabled="!startDate || !endDate">
            查询
          </button>
        </view>
      </view>
      <!-- 饼状图区域 -->
      <view class="pie-chart-container">
        <div id="pieChart"></div>
      </view>
      <!-- name/count 对应表格 -->
      <view class="knowledge-bar-list">
        <view
          class="knowledge-bar-item"
          v-for="(item, idx) in pieData"
          :key="item.name"
          @click="handleBarClick(item)"
        >
          <view class="bar-content">
            <view class="bar-title">{{ item.name }}</view>
            <view class="bar-bg">
              <view
                class="bar-fill"
                :style="{
                  width: ((item.value / maxWrongCount) * 100) + '%',
                  background: barColors[idx % barColors.length]
                }"
              ></view>
            </view>
          </view>
          <view class="bar-value">错题数：{{ item.value }}</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import * as echarts from 'echarts';
import { getWrongQuestionKnowledgePoints } from '@/api/exam';
// uni-icons will be automatically imported via easycom

// 获取胶囊按钮位置信息和状态栏高度（用于计算自定义头部高度）
const menuButtonHeight = ref(0);
const menuButtonTop = ref(0);
const statusBarHeight = ref(0);

// #ifdef MP-WEIXIN
const systemInfo = uni.getSystemInfoSync();
statusBarHeight.value = systemInfo.statusBarHeight;
const menuButtonInfo = uni.getMenuButtonBoundingClientRect();
menuButtonHeight.value = menuButtonInfo.height;
menuButtonTop.value = menuButtonInfo.top;
// #endif

// #ifdef H5
statusBarHeight.value = 0;
const h5HeaderHeight = 44;
menuButtonTop.value = 0; // Not applicable for H5
menuButtonHeight.value = h5HeaderHeight; // Use standard header height for calculation
// #endif

// 计算头部总高度
const headerHeight = computed(() => {
  // #ifdef MP-WEIXIN
  return menuButtonTop.value + menuButtonHeight.value + 'px';
  // #endif
  // #ifdef H5
  return (statusBarHeight.value + h5HeaderHeight) + 'px';
  // #endif
  return '0px'; // Default
});

// 返回上一页
const goBack = () => {
  // 直接使用 switchTab 跳转到 mine 页面
  uni.switchTab({
    url: '/pages/mine/index',
    fail: (err) => {
      console.error('Navigation failed:', err);
      uni.showToast({
        title: '返回失败',
        icon: 'none'
      });
    }
  });
};

// 日期选择相关
const startDate = ref('');
const endDate = ref('');
const startDateLimit = '2020-01-01';
const endDateLimit = new Date().toISOString().split('T')[0];

// 查询时格式化时间
const currentStartDateTime = computed(() => startDate.value ? `${startDate.value} 00:00:00` : '');
const currentEndDateTime = computed(() => endDate.value ? `${endDate.value} 23:59:59` : '');

const onStartDateChange = (e) => {
  startDate.value = e.detail.value;
};
const onEndDateChange = (e) => {
  endDate.value = e.detail.value;
};
const pieData = ref([]);

const handleBarClick = (item) => {
  // 获取 studentId、knowledgePointId、startDate、endDate
  const studentId = uni.getStorageSync('id');
  const knowledgePointId = item.knowledgePointId;
  const start = startDate.value ? `${startDate.value} 00:00:00` : '';
  const end = endDate.value ? `${endDate.value} 23:59:59` : '';
  if (!studentId || !knowledgePointId || !start || !end) {
    uni.showToast({ title: '参数缺失', icon: 'none' });
    return;
  }
  // 跳转到错题分析页面，传递参数
  uni.navigateTo({
    url: `/pages/mine/wrongQuestionsAnalysis/index?studentId=${encodeURIComponent(studentId)}&knowledgePointId=${encodeURIComponent(knowledgePointId)}&startTime=${encodeURIComponent(start)}&endTime=${encodeURIComponent(end)}`
  });
};

const handleSearch = async () => {
  const studentId = uni.getStorageSync('id');
  if (!studentId) {
    uni.showToast({ title: '请先登录', icon: 'none' });
    return;
  }
  if (!startDate.value || !endDate.value) {
    uni.showToast({ title: '请选择时间', icon: 'none' });
    return;
  }
  console.log('[学情图谱] 查询参数:', {
    studentId,
    startTime: currentStartDateTime.value,
    endTime: currentEndDateTime.value
  });
  uni.showLoading({ title: '加载中...' });
  try {
    const res = await getWrongQuestionKnowledgePoints(
      studentId,
      currentStartDateTime.value,
      currentEndDateTime.value
    );
    console.log('[学情图谱] 接口响应:', res);
    uni.hideLoading();
    if (res.flag === '1' && Array.isArray(res.result)) {
      pieData.value = res.result.map(item => ({
        value: item.count,
        name: item.name,
        knowledgePointId: item.knowledgePointId
      }));
      console.log('pieData for bar:', pieData.value); // 调试用
      updatePieChart();
    } else {
      pieData.value = [];
      updatePieChart();
      uni.showToast({ title: res.msg || '暂无数据', icon: 'none' });
    }
  } catch (e) {
    uni.hideLoading();
    pieData.value = [];
    updatePieChart();
    console.error('[学情图谱] 查询失败:', e);
    uni.showToast({ title: '查询失败', icon: 'none' });
  }
};

let myChart = null;

function updatePieChart() {
  // #ifdef H5
  const chartDom = document.getElementById('pieChart');
  if (!chartDom) return;
  if (!myChart) {
    myChart = echarts.init(chartDom);
    window.addEventListener('resize', resizeChart);
  }
  const option = {
    color: [
      '#5470C6', '#91CC75', '#FAC858', '#EE6666', '#73C0DE',
      '#3BA272', '#FC8452', '#9A60B4', '#EA7CCC', '#FFB300',
      '#00BFFF', '#FF69B4', '#8B4513', '#228B22', '#20B2AA',
      '#FF6347', '#4682B4', '#FFD700', '#6A5ACD', '#40E0D0'
    ],
    title: {
      text: '错题知识点分布',
      left: 'center'
    },
    tooltip: {
      trigger: 'item'
    },
    legend: {
      orient: 'horizontal',
      left: 'center',
      top: '70%',
      width: '100%',
      type: 'plain',
      itemWidth: 18,
      itemHeight: 14,
      textStyle: {
        fontSize: 12
      }
    },
    series: [
      {
        name: '知识点',
        type: 'pie',
        radius: '50%',
        center: ['50%', '35%'],
        data: pieData.value,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        label: {
          show: true
        }
      }
    ]
  };
  myChart.setOption(option, true);
  // #endif
}

onMounted(() => {
  // #ifdef H5
  updatePieChart();
  // #endif
});

function resizeChart() {
  if (myChart) {
    myChart.resize();
  }
}

onBeforeUnmount(() => {
  // #ifdef H5
  if (myChart) {
    myChart.dispose();
    myChart = null;
  }
  window.removeEventListener('resize', resizeChart);
  // #endif
});

onLoad((options = {}) => {
  // 页面加载时的逻辑
  // 自动查询半个月区间的知识点分析
  // decode 参数
  let studentId = uni.getStorageSync('id');
  let startTime, endTime, knowledgePointId;
  if (options.studentId) studentId = decodeURIComponent(options.studentId);
  if (options.startTime) startTime = decodeURIComponent(options.startTime);
  if (options.endTime) endTime = decodeURIComponent(options.endTime);
  if (options.knowledgePointId) knowledgePointId = decodeURIComponent(options.knowledgePointId);

  if (!studentId) return;
  // 如果有参数则用参数，否则默认半个月
  let now = new Date();
  let endDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  let startDateObj = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  let startDateStr = `${startDateObj.getFullYear()}-${String(startDateObj.getMonth() + 1).padStart(2, '0')}-${String(startDateObj.getDate()).padStart(2, '0')}`;
  if (startTime) {
    startDateStr = startTime.split(' ')[0];
  }
  if (endTime) {
    endDateStr = endTime.split(' ')[0];
  }
  startDate.value = startDateStr;
  endDate.value = endDateStr;

  // 查询
  (async () => {
    uni.showLoading({ title: '加载中...' });
    try {
      const res = await getWrongQuestionKnowledgePoints(studentId, startTime || `${startDateStr} 00:00:00`, endTime || `${endDateStr} 23:59:59`, knowledgePointId);
      uni.hideLoading();
      if (res.flag === '1' && Array.isArray(res.result)) {
        pieData.value = res.result.map(item => ({ value: item.count, name: item.name, knowledgePointId: item.knowledgePointId}));
        updatePieChart();
      } else {
        pieData.value = [];
        updatePieChart();
        uni.showToast({ title: res.msg || '暂无数据', icon: 'none' });
      }
    } catch (e) {
      uni.hideLoading();
      pieData.value = [];
      updatePieChart();
      uni.showToast({ title: '查询失败', icon: 'none' });
    }
  })();
});

const barColors = [
  'linear-gradient(90deg, #3B82F6 0%, #60A5FA 100%)',
  'linear-gradient(90deg, #10B981 0%, #6EE7B7 100%)',
  'linear-gradient(90deg, #F59E42 0%, #FDE68A 100%)',
  'linear-gradient(90deg, #EF4444 0%, #FCA5A5 100%)',
  'linear-gradient(90deg, #6366F1 0%, #A5B4FC 100%)',
  'linear-gradient(90deg, #F472B6 0%, #FBCFE8 100%)',
  'linear-gradient(90deg, #14B8A6 0%, #5EEAD4 100%)',
  'linear-gradient(90deg, #8B5CF6 0%, #C4B5FD 100%)',
  'linear-gradient(90deg, #84CC16 0%, #BEF264 100%)',
  'linear-gradient(90deg, #4338CA 0%, #818CF8 100%)',
  'linear-gradient(90deg, #D97706 0%, #FCD34D 100%)',
  'linear-gradient(90deg, #64748B 0%, #94A3B8 100%)'
];
const maxWrongCount = computed(() => Math.max(...pieData.value.map(i => i.value), 1));
</script>

<style lang="scss" scoped>
.container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: linear-gradient(135deg, #f8f8ff 0%, #e0e7ff 100%);
  padding: 0 20rpx 20rpx 20rpx;
  box-sizing: border-box;
}

.header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20rpx;
  width: 100%;
  box-sizing: border-box;
  background: linear-gradient(135deg, #f8f8ff 0%, #e0e7ff 100%);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
}

.left-section {
  display: flex;
  align-items: center;
  height: 100%;
}

.center-section {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.header-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}

.right-section {
  display: flex;
  align-items: center;
  height: 100%;
  width: 60rpx;
}

.back-button {
  width: 60rpx;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  height: 100%;
}

.content {
  flex: 1;
  width: 100%;
  box-sizing: border-box;
  /* padding-top is applied via :style to account for header height */
  overflow-y: auto;
}

.date-picker-container {
  display: flex;
  flex-direction: column;
  padding: 20rpx;
  background-color: #fff;
  border-radius: 12rpx;
  margin: 20rpx 0;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}
.date-pickers-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 30rpx;
}
.date-picker-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  &:first-child { margin-right: 20rpx; }
}
.date-label {
  font-size: 24rpx;
  color: #666;
  margin-bottom: 8rpx;
}
.picker-value {
  height: 70rpx;
  line-height: 70rpx;
  text-align: center;
  font-size: 28rpx;
  color: #333;
  background-color: #f5f7fa;
  border-radius: 8rpx;
}
.search-btn-container { padding: 0; }
.search-btn {
  width: 100%;
  height: 80rpx;
  line-height: 80rpx;
  text-align: center;
  background: linear-gradient(135deg, #a6c0fe 0%, #8a9efd 100%);
  color: #fff;
  border-radius: 40rpx;
  font-size: 28rpx;
  border: none;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
  &:active { opacity: 0.9; }
  &:disabled { background: #cccccc; opacity: 0.7; }
}
.pie-chart-container {
  width: 100%;
  height: 440px;
  margin: 20rpx 0;
  background: #fff;
  border-radius: 12rpx;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.05);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
#pieChart {
  width: 100% !important;
  height: 100% !important;
  min-width: 0;
}
.knowledge-bar-list {
  margin: 20rpx 0;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  background: #fff;
  border-radius: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04);
  padding: 20rpx;
}
.knowledge-bar-item {
  display: flex;
  align-items: center;
  padding-bottom: 16rpx;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  &:last-child {
    border-bottom: none;
  }
}
.bar-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}
.bar-title {
  font-size: 28rpx;
  color: #333;
  font-weight: bold;
}
.bar-bg {
  width: 100%;
  height: 16rpx;
  background: #f3f4f6;
  border-radius: 8rpx;
  overflow: hidden;
}
.bar-fill {
  height: 100%;
  border-radius: 8rpx;
  transition: width 0.5s;
}
.bar-value {
  margin-left: 24rpx;
  font-size: 24rpx;
  color: #666;
  white-space: nowrap;
}
</style> 