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
        <text class="header-title">错题集</text>
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
            <view class="datetime-picker">
              <picker mode="date" :value="startDate" :start="startDateLimit" :end="endDate || endDateLimit" @change="onStartDateChange" class="picker date-picker">
                <view class="picker-value">{{ startDate || '选择日期' }}</view>
              </picker>
              <picker mode="selector" :range="[...Array(24).keys()]" :value="Number(startTime)" @change="onStartTimeChange" class="picker time-picker">
                <view class="picker-value">{{ formatHour(startTime) }}时</view>
              </picker>
            </view>
          </view>
          <view class="date-picker-item">
            <text class="date-label">结束时间</text>
            <view class="datetime-picker">
              <picker mode="date" :value="endDate" :start="startDate || startDateLimit" :end="maxEndDate" @change="onEndDateChange" class="picker date-picker">
                <view class="picker-value">{{ endDate || '选择日期' }}</view>
              </picker>
              <picker mode="selector" :range="[...Array(24).keys()]" :value="Number(endTime)" @change="onEndTimeChange" class="picker time-picker">
                <view class="picker-value">{{ formatHour(endTime) }}时</view>
              </picker>
            </view>
          </view>
        </view>
        <!-- 查询按钮 -->
        <view class="search-btn-container">
          <button class="search-btn" @click="handleSearch" :disabled="!startDate || !endDate">
            查询
          </button>
        </view>
      </view>

      <!-- 在日期选择器容器下方添加错题统计列表 -->
      <view class="wrong-questions-list" v-if="dailyData.length > 0">
        <view 
          class="wrong-question-item" 
          v-for="(item, index) in dailyData.slice().reverse()" 
          :key="index"
          @click="handleItemClick(item)"
        >
          <view class="date-range">
            <text class="time-label">时间范围：</text>
            <view class="time-range">
              <text>{{ getStartTimeForDate(item.date) }}</text>
              <text class="time-separator">至</text>
              <text>{{ getEndTimeForDate(item.date) }}</text>
            </view>
          </view>
          <view class="count-info">
            <text class="count-label">错题数量：</text>
            <text class="count-value">{{ item.count }}</text>
          </view>
        </view>
      </view>
      
      <!-- 无数据时的提示 -->
      <view class="empty-state" v-else-if="hasSearched">
        <text>该时间段内暂无错题记录</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getWrongQuestionCount } from '@/api/exam';
import { useUserStore } from '@/stores/user';

// 获取胶囊按钮位置信息和状态栏高度（用于计算自定义头部高度）
const menuButtonHeight = ref(0);
const menuButtonTop = ref(0);
const statusBarHeight = ref(0);

// 日期选择相关
const startDate = ref('');
const endDate = ref('');
const startTime = ref('00');  // 开始时间的小时
const endTime = ref('00');    // 结束时间的小时
const startDateLimit = '2020-01-01'; // 可选择的最早日期
const endDateLimit = new Date().toISOString().split('T')[0]; // 今天

// 格式化小时显示
const formatHour = (hour) => {
  return String(hour).padStart(2, '0');
};

// 格式化完整时间
const formatFullDateTime = (date, hour) => {
  if (!date) return '';
  return `${date} ${formatHour(hour)}:00:00`;
};

// 获取当前完整的开始时间和结束时间
const currentStartDateTime = computed(() => formatFullDateTime(startDate.value, startTime.value));
const currentEndDateTime = computed(() => formatFullDateTime(endDate.value, endTime.value));

// 检查日期间隔是否超过7天
const checkDateInterval = (start, end) => {
  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();
  const daysDiff = Math.floor((endTime - startTime) / (1000 * 60 * 60 * 24));
  return daysDiff <= 7;
};

// 计算最大可选结束日期
const maxEndDate = computed(() => {
  if (!startDate.value) return endDateLimit;
  const maxDate = new Date(startDate.value);
  maxDate.setDate(maxDate.getDate() + 7);
  const formattedMaxDate = maxDate.toISOString().split('T')[0];
  return formattedMaxDate > endDateLimit ? endDateLimit : formattedMaxDate;
});

// 日期选择处理函数
const onStartDateChange = (e) => {
  const newStartDate = e.detail.value;
  
  // 如果已有结束日期，检查间隔
  if (endDate.value) {
    if (!checkDateInterval(newStartDate, endDate.value)) {
      uni.showToast({
        title: '时间间隔不能超过7天',
        icon: 'none'
      });
      // 如果超过7天，将结束日期设置为开始日期后的第7天
      const maxDate = new Date(newStartDate);
      maxDate.setDate(maxDate.getDate() + 7);
      const formattedMaxDate = maxDate.toISOString().split('T')[0];
      endDate.value = formattedMaxDate > endDateLimit ? endDateLimit : formattedMaxDate;
    }
  }
  
  startDate.value = newStartDate;
};

const onEndDateChange = (e) => {
  const newEndDate = e.detail.value;
  
  // 检查与开始日期的间隔
  if (startDate.value && !checkDateInterval(startDate.value, newEndDate)) {
    uni.showToast({
      title: '时间间隔不能超过7天',
      icon: 'none'
    });
    return;
  }
  
  endDate.value = newEndDate;
};

// #ifdef MP-WEIXIN
const systemInfo = uni.getSystemInfoSync();
statusBarHeight.value = systemInfo.statusBarHeight;
const menuButtonInfo = uni.getMenuButtonBoundingClientRect();
menuButtonHeight.value = menuButtonInfo.height;
menuButtonTop.value = menuButtonInfo.top;
// #endif

// #ifdef H5
statusBarHeight.value = 0;
// H5端模拟一个固定高度的头部
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

// 时间选择处理函数
const onStartTimeChange = (e) => {
  startTime.value = String(e.detail.value);
};

const onEndTimeChange = (e) => {
  endTime.value = String(e.detail.value);
};

// 新增状态
const dailyData = ref([]);
const hasSearched = ref(false);
const userStore = useUserStore();

// 获取某个日期的开始时间
const getStartTimeForDate = (date) => {
  if (date === dailyData.value[0]?.date) {
    // 对于第一天，使用用户选择的开始时间
    return currentStartDateTime.value;
  }
  return `${date} 00:00:00`;
};

// 获取某个日期的结束时间
const getEndTimeForDate = (date) => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + 1);
  
  if (date === dailyData.value[dailyData.value.length - 1]?.date) {
    // 对于最后一天，使用用户选择的结束时间
    return currentEndDateTime.value;
  }
  
  // 对于其他天，使用下一天的 00:00:00
  const year = nextDate.getFullYear();
  const month = String(nextDate.getMonth() + 1).padStart(2, '0');
  const day = String(nextDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day} 00:00:00`;
};

// 处理列表项点击
const handleItemClick = (item) => {
  const startTime = getStartTimeForDate(item.date);
  const endTime = getEndTimeForDate(item.date);
  const studentId = userStore.id;
  uni.navigateTo({
  url: `/pages/mine/wrongQuestionsAnalysis/index?startTime=${encodeURIComponent(startTime)}&endTime=${encodeURIComponent(endTime)}&studentId=${studentId}`
});
  console.log('选中的时间范围:', {
    startTime,
    endTime,
    studentId,
    count: item.count
  });
  
  // 这里可以根据需要进行导航或其他操作
  // TODO: 处理点击事件
};

// 修改查询处理函数
const handleSearch = async () => {
  if (!startDate.value || !endDate.value) {
    uni.showToast({
      title: '请选择开始和结束时间',
      icon: 'none'
    });
    return;
  }

  const studentId = userStore.id;
  if (!studentId) {
    uni.showToast({
      title: '请先登录',
      icon: 'none'
    });
    return;
  }

  try {
    uni.showLoading({
      title: '加载中...'
    });

    const response = await getWrongQuestionCount(
      studentId,
      currentStartDateTime.value,
      currentEndDateTime.value
    );

    uni.hideLoading();
    hasSearched.value = true;

    if (response && response.flag === '1') {
      dailyData.value = response.result.dailyData || [];
      console.log('错题统计数据:', dailyData.value);
    } else {
      uni.showToast({
        title: response?.msg || '获取数据失败',
        icon: 'none'
      });
      dailyData.value = [];
    }
  } catch (error) {
    uni.hideLoading();
    console.error('获取错题统计失败:', error);
    uni.showToast({
      title: '获取数据失败',
      icon: 'none'
    });
    dailyData.value = [];
  }
};

onLoad((options) => {
  console.log('Wrong Questions Page Loaded');
  // decode 参数
  if (options.startTime) options.startTime = decodeURIComponent(options.startTime);
  if (options.endTime) options.endTime = decodeURIComponent(options.endTime);
  if (options.studentId) options.studentId = decodeURIComponent(options.studentId);

  // 如果有URL参数，设置时间并自动查询
  if (options.startTime && options.endTime) {
    const startDateTime = new Date(options.startTime);
    const endDateTime = new Date(options.endTime);
    // 设置日期
    startDate.value = startDateTime.toISOString().split('T')[0];
    endDate.value = endDateTime.toISOString().split('T')[0];
    // 设置时间
    startTime.value = String(startDateTime.getHours());
    endTime.value = String(endDateTime.getHours());
    
    // 如果有传递的 studentId，临时保存用于查询
    if (options.studentId) {
      // 临时替换 userStore.id 用于这次查询
      const originalId = userStore.id;
      userStore.id = options.studentId;
      // 自动查询
      handleSearch();
      // 查询完成后恢复原来的 id
      userStore.id = originalId;
    } else {
      // 自动查询
      handleSearch();
    }
  }
});

onMounted(() => {
  // 如果有需要在页面 mounted 时执行的逻辑可以放这里
});

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

/* 自定义头部样式 */
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
  overflow-y: auto;
}

/* 日期选择器样式 */
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

  &:first-child {
    margin-right: 20rpx;
  }
}

.date-label {
  font-size: 24rpx;
  color: #666;
  margin-bottom: 8rpx;
}

.datetime-picker {
  display: flex;
  gap: 10rpx;
}

.date-picker {
  flex: 2;
}

.time-picker {
  flex: 1;
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

/* 查询按钮样式 */
.search-btn-container {
  padding: 0;
}

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

  &:active {
    opacity: 0.9;
  }

  &:disabled {
    background: #cccccc;
    opacity: 0.7;
  }
}

/* 错题统计列表样式 */
.wrong-questions-list {
  margin-top: 20rpx;
}

.wrong-question-item {
  background-color: #fff;
  border-radius: 12rpx;
  padding: 20rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.date-range {
  margin-bottom: 16rpx;
}

.time-label {
  font-size: 28rpx;
  color: #666;
}

.time-range {
  margin-top: 8rpx;
  font-size: 26rpx;
  color: #333;
}

.time-separator {
  margin: 0 10rpx;
  color: #999;
}

.count-info {
  display: flex;
  align-items: center;
}

.count-label {
  font-size: 28rpx;
  color: #666;
}

.count-value {
  font-size: 32rpx;
  color: #007AFF;
  font-weight: bold;
  margin-left: 10rpx;
}

.empty-state {
  margin-top: 40rpx;
  text-align: center;
  color: #999;
  font-size: 28rpx;
}
</style>