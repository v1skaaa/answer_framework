<template>
  <view class="exam-answering-container" :style="{ paddingTop: containerPaddingTop }">
    <!-- 自定义头部 (仅保留返回按钮) -->
    <view class="header-bar" :style="{ height: headerHeight, paddingTop: statusBarHeight + 'px' }">
      <view class="left-section">
        <view class="back-button" @click="goBack">
          <uni-icons type="left" size="24" color="#333"></uni-icons>
        </view>
      </view>
       <view class="right-section"></view> <!-- 右侧占位符以保持返回按钮居左 -->
    </view>

    <!-- 题目内容区域容器，添加触摸事件监听 -->
    <!-- 设置相对定位和隐藏溢出 -->
    <view 
        class="question-content-wrapper"
        @touchstart="handleTouchStart"
        @touchmove="handleTouchMove"
        @touchend="handleTouchEnd"
        >
        <!-- 将试卷名称和右侧元素放在这里，在返回按钮下方 -->
        <!-- 添加 ref 引用 -->
        <view class="content-header" ref="contentHeaderRef">
            <view class="paper-title-in-content">{{ paperTitle }}</view> <!-- 试卷名称 -->
             <view class="content-header-icons">
                <text class="question-counter">{{ currentQuestionIndex + 1 }} / {{ totalQuestions }}</text> <!-- 题目标号和总数 -->
                <uni-icons type="star" size="24" color="#333" class="header-icon"></uni-icons> <!-- 收藏 -->
                <uni-icons type="bars" size="24" color="#333" class="header-icon" @click="toggleQuestionCard"></uni-icons> <!-- 答题卡 -->
                <text class="countdown">{{ formattedTime }}</text> <!-- 倒计时 -->
            </view>
        </view>

        <!-- Use transition component for non-mini-program platforms -->
        <!-- For mini-program, we'll use native animation -->
        <transition :name="'slide-' + transitionDirection" v-if="!isMiniProgram">
            <view 
                class="question-content"
                :key="currentQuestion.id"
                :style="{
                    top: contentHeaderHeight + 'px'
                }"
                >
              <!-- Here display question text and images -->
                <view class="question-main">
                    <view class="question-text">{{ currentQuestion.text }}</view>
                    <image v-if="currentQuestion.image" :src="currentQuestion.image" mode="widthFix" class="question-image"></image>

                    <!-- 答案区域 -->
                    <view class="answer-area">
                        <block v-if="currentQuestion.type === 'choice'">
                            <view 
                                class="choice-item" 
                                v-for="(option, index) in currentQuestion.options" 
                                :key="index"
                                @click="selectOption(option.value)"
                                :class="{'selected': currentQuestion.selectedAnswer === option.value}"
                                >
                                <text class="option-label">{{ option.label }}</text>
                                <text class="option-text">{{ option.text }}</text>
                            </view>
                        </block>
                        <block v-else>
                            <!-- 填空题和解答题提示 -->
                            <view class="unsupported-tip">
                                <text>本题暂不支持在线作答</text>
                                <text>可在交卷后核对答案并查看解析</text>
                            </view>
                        </block>
                    </view>
                </view>
            </view>
        </transition>

         <!-- Content for mini-program using native animation -->
        <view 
            v-if="isMiniProgram"
            class="question-content"
            :style="{
                top: contentHeaderHeight + 'px'
            }"
            :animation="animationData"
            >
            <view class="question-main">
                <view class="question-text">{{ currentQuestion.text }}</view>
                <image v-if="currentQuestion.image" :src="currentQuestion.image" mode="widthFix" class="question-image"></image>

                <!-- 答案区域 -->
                <view class="answer-area">
                    <block v-if="currentQuestion.type === 'choice'">
                        <view 
                            class="choice-item" 
                            v-for="(option, index) in currentQuestion.options" 
                            :key="index"
                            @click="selectOption(option.value)"
                            :class="{'selected': currentQuestion.selectedAnswer === option.value}"
                            >
                            <text class="option-label">{{ option.label }}</text>
                            <text class="option-text">{{ option.text }}</text>
                        </view>
                    </block>
                    <block v-else>
                        <!-- 填空题和解答题提示 -->
                        <view class="unsupported-tip">
                            <text>本题暂不支持在线作答</text>
                            <text>可在交卷后核对答案并查看解析</text>
                        </view>
                    </block>
                </view>
            </view>
        </view>

    </view>

    <!-- 答题卡覆盖层 -->
    <view class="question-card-overlay" :class="{'show': showQuestionCard}" @click="toggleQuestionCard">
      <view class="question-card-content" @click.stop>
        <view class="card-header">
          <text class="card-title">答题卡</text>
          <uni-icons type="close" size="24" color="#333" @click="toggleQuestionCard"></uni-icons>
        </view>
        <scroll-view class="card-body" scroll-y>
          <view class="question-type-section" v-for="(type, typeIndex) in questionTypes" :key="typeIndex">
            <text class="type-title">{{ type.name }} (共{{ type.count }}题)</text>
            <view class="question-number-list">
              <view 
                class="question-number-item"
                 v-for="(question, qIndex) in type.questions" 
                 :key="qIndex"
                 :class="{'answered': question.answered}"
                 @click="goToQuestion(question.index)"
                 >
                {{ question.number }}
              </view>
            </view>
          </view>
        </scroll-view>
        <view class="card-footer">
          <button class="submit-button" @click="submitExam">交卷并查看结果</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
// uni-icons will be automatically imported via easycom

// Declare optionClickedRecently ref to prevent ReferenceError
const optionClickedRecently = ref(false);

// 获取胶囊按钮位置信息和状态栏高度
const menuButtonHeight = ref(0);
const menuButtonTop = ref(0);
// #ifdef MP-WEIXIN
const systemInfo = wx.getWindowInfo();
const statusBarHeight = systemInfo.statusBarHeight;
// #endif
// #ifdef H5
const statusBarHeight = 0;
// #endif

// 判断是否是小程序环境
const isMiniProgram = ref(false);
// #ifdef MP-WEIXIN
isMiniProgram.value = true;
// #endif

// 计算头部总高度 (仅返回按钮部分)
const headerHeight = computed(() => {
  // #ifdef MP-WEIXIN
  return menuButtonTop.value + menuButtonHeight.value + 'px';
  // #endif
  // #ifdef H5
  return (statusBarHeight + 44) + 'px';
  // #endif
  return '0px';
});

// 计算内容区域的顶部内边距 (考虑头部高度)
const containerPaddingTop = computed(() => {
   // #ifdef MP-WEIXIN
  return menuButtonTop.value + menuButtonHeight.value + 'px';
  // #endif
  // #ifdef H5
  return (statusBarHeight + 44) + 'px';
  // #endif
  return '0px';
});

// 模拟试卷和题目数据
const paperTitle = ref('模拟试卷名称'); // 试卷名称
const questions = ref([]); // 题目列表
const currentQuestionIndex = ref(0); // 当前题目索引
const totalQuestions = computed(() => questions.value.length); // 总题目数量

// 当前显示的题目
const currentQuestion = computed(() => questions.value[currentQuestionIndex.value] || {});

// 答题卡数据结构
const questionTypes = computed(() => {
    const types = {};
    // 确保 questions 数组不为空
    if (!questions.value || questions.value.length === 0) {
        return [];
    }
    questions.value.forEach(q => {
        // 使用 type 作为键名，如果不存在则初始化
        if (!types[q.type]) {
            types[q.type] = { name: q.type === 'choice' ? '选择题' : q.type === 'fill' ? '填空题' : '解答题', count: 0, questions: [] };
        }
        types[q.type].count++;
        // 为每个题目项添加 number, index 和 answered 属性
        types[q.type].questions.push({ number: q.number, index: q.index, answered: !!q.selectedAnswer }); // 使用 !! 将 selectedAnswer 转换为布尔值判断是否已作答
    });
    // 将对象转换为数组，并按照选择、填空、解答的顺序排序
    const orderedTypes = [];
    if (types['choice']) orderedTypes.push(types['choice']);
    if (types['fill']) orderedTypes.push(types['fill']);
    if (types['text']) orderedTypes.push(types['text']);
    // 如果有其他类型的题目，也可以在这里添加处理
    for (const typeKey in types) {
        if (!['choice', 'fill', 'text'].includes(typeKey)) {
            orderedTypes.push(types[typeKey]);
        }
    }
    return orderedTypes;
});

// 答题卡显示状态
const showQuestionCard = ref(false);

// 倒计时相关
const timeRemaining = ref(3600); // 模拟倒计时，单位秒 (例如 1小时)
const timer = ref(null);

const formattedTime = computed(() => {
  const minutes = Math.floor(timeRemaining.value / 60);
  const seconds = timeRemaining.value % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
});

// 用于控制过渡动画方向的变量 (仅用于非小程序平台)
const transitionDirection = ref('left');

// 小程序原生动画相关变量
const animationData = ref({});
let animation = null;
let isAnimating = false; // 添加动画状态标志

// 初始化小程序动画实例
const initMPAnimation = () => {
    // #ifdef MP-WEIXIN
    animation = uni.createAnimation({
        duration: 250,
        timingFunction: 'ease',
        delay: 0,
        transformOrigin: '50% 50%'
    });
    // #endif
};

// 运行小程序动画
const runMPAnimation = (direction, callback) => {
    // #ifdef MP-WEIXIN
    if (!animation || isAnimating) {
        if(isAnimating) console.log('正在动画中，忽略本次触发');
        return;
    }

    isAnimating = true;

    // 先更新题目索引和答案
    if (direction === 'left') {
        if (currentQuestionIndex.value < totalQuestions.value - 1) {
            currentQuestionIndex.value++;
        }
    } else {
        if (currentQuestionIndex.value > 0) {
            currentQuestionIndex.value--;
        }
    }
    // selectedAnswer.value = questions.value[currentQuestionIndex.value].selectedAnswer || null;

    const moveDistance = direction === 'left' ? '-100%' : '100%';

    // 先将当前内容移出视图
    animation.translateX(moveDistance).step();
    animationData.value = animation.export();

    // 在动画完成后重置位置
    setTimeout(() => {
        // 将新内容移入视图前的准备位置
        animation.translateX(direction === 'left' ? '100%' : '-100%').step({ duration: 0 });
        animationData.value = animation.export();

        // 等待 DOM 更新后，将新内容动画移入
        nextTick(() => {
            animation.translateX(0).step();
            animationData.value = animation.export();
            isAnimating = false;
            if(callback) callback();
        });
    }, 250);
    // #endif
};


// 模拟数据填充 (替代接口请求)
const loadMockData = () => {
  paperTitle.value = '2023年模拟高考数学卷';
  // 增加更多模拟数据，按照高考数学卷规范顺序排列
  questions.value = [
    // 选择题 1-9 (共9题)
    { id: 1, number: 1, type: 'choice', text: '题目文本1：这是一道选择题。', options: [{label: 'A', text: '选项A', value: 'A'}, {label: 'B', text: '选项B', value: 'B'}, {label: 'C', text: '选项C', value: 'C'}, {label: 'D', text: '选项D', value: 'D'}], selectedAnswer: null, index: 0 },
    { id: 2, number: 2, type: 'choice', text: '题目文本2：这是一道选择题，已作答。', options: [{label: 'A', text: '选项A', value: 'A'}, {label: 'B', text: '选项B', value: 'B'}, {label: 'C', text: '选项C', value: 'C'}, {label: 'D', text: '选项D', value: 'D'}], selectedAnswer: 'A', index: 1 },
    { id: 3, number: 3, type: 'choice', text: '题目文本3：这是一道选择题。', options: [{label: 'A', text: '选项A', value: 'A'}, {label: 'B', text: '选项B', value: 'B'}, {label: 'C', text: '选项C', value: 'C'}, {label: 'D', text: '选项D', value: 'D'}], selectedAnswer: null, index: 2 },
    { id: 4, number: 4, type: 'choice', text: '题目文本4：这是一道选择题。', options: [{label: 'A', text: '选项A', value: 'A'}, {label: 'B', text: '选项B', value: 'B'}, {label: 'C', text: '选项C', value: 'C'}, {label: 'D', text: '选项D', value: 'D'}], selectedAnswer: null, index: 3 },
    { id: 5, number: 5, type: 'choice', text: '题目文本5：这是一道选择题。', options: [{label: 'A', text: '选项A', value: 'A'}, {label: 'B', text: '选项B', value: 'B'}, {label: 'C', text: '选项C', value: 'C'}, {label: 'D', text: '选项D', value: 'D'}], selectedAnswer: null, index: 4 },
    { id: 6, number: 6, type: 'choice', text: '题目文本6：这是一道选择题。', options: [{label: 'A', text: '选项A', value: 'A'}, {label: 'B', text: '选项B', value: 'B'}, {label: 'C', text: '选项C', value: 'C'}, {label: 'D', text: '选项D', value: 'D'}], selectedAnswer: null, index: 5 },
    { id: 7, number: 7, type: 'choice', text: '题目文本7：这是一道选择题。', options: [{label: 'A', text: '选项A', value: 'A'}, {label: 'B', text: '选项B', value: 'B'}, {label: 'C', text: '选项C', value: 'C'}, {label: 'D', text: '选项D', value: 'D'}], selectedAnswer: null, index: 6 },
    { id: 8, number: 8, type: 'choice', text: '题目文本8：这是一道选择题。', options: [{label: 'A', text: '选项A', value: 'A'}, {label: 'B', text: '选项B', value: 'B'}, {label: 'C', text: '选项C', value: 'C'}, {label: 'D', text: '选项D', value: 'D'}], selectedAnswer: null, index: 7 },
    { id: 9, number: 9, type: 'choice', text: '题目文本9：这是一道选择题。', options: [{label: 'A', text: '选项A', value: 'A'}, {label: 'B', text: '选项B', value: 'B'}, {label: 'C', text: '选项C', value: 'C'}, {label: 'D', text: '选项D', value: 'D'}], selectedAnswer: null, index: 8 },
    // 填空题 10-15 (共6题)
    { id: 10, number: 10, type: 'fill', text: '题目文本10：这是一道填空题。' , selectedAnswer: null, index: 9 },
    { id: 11, number: 11, type: 'fill', text: '题目文本11：这是一道填空题。' , selectedAnswer: null, index: 10 },
    { id: 12, number: 12, type: 'fill', text: '题目文本12：这是一道填空题。' , selectedAnswer: null, index: 11 },
    { id: 13, number: 13, type: 'fill', text: '题目文本13：这是一道填空题。' , selectedAnswer: null, index: 12 },
    { id: 14, number: 14, type: 'fill', text: '题目文本14：这是一道填空题。' , selectedAnswer: null, index: 13 },
    { id: 15, number: 15, type: 'fill', text: '题目文本15：这是一道填空题。' , selectedAnswer: null, index: 14 },
    // 解答题 16-20 (共5题)
    { id: 16, number: 16, type: 'text', text: '题目文本16：这是一道解答题。' , selectedAnswer: null, index: 15 },
    { id: 17, number: 17, type: 'text', text: '题目文本17：这是一道解答题。' , selectedAnswer: null, index: 16 },
    { id: 18, number: 18, type: 'text', text: '题目文本18：这是一道解答题。' , selectedAnswer: null, index: 17 },
    { id: 19, number: 19, type: 'text', text: '题目文本19：这是一道解答题。' , selectedAnswer: null, index: 18 },
    { id: 20, number: 20, type: 'text', text: '题目文本20：这是一道解答题。' , selectedAnswer: null, index: 19 }
  ];
};

// 题目切换
// isSwipe 参数用于区分是点击还是滑动触发
// direction 参数用于指示滑动方向，'left' 或 'right'
const nextQuestion = (isSwipe = false, direction = 'left') => {
  if (currentQuestionIndex.value < totalQuestions.value - 1) {
    // #ifdef MP-WEIXIN
    runMPAnimation(direction);
    // #endif

    // #ifndef MP-WEIXIN
    transitionDirection.value = direction;
    currentQuestionIndex.value++;
    // selectedAnswer.value = questions.value[currentQuestionIndex.value].selectedAnswer || null;
    // #endif

  } else if (isSwipe) {
    console.log('已经是最后一题，向左滑动，尝试进入答题卡');
    toggleQuestionCard();
  }
};

// isSwipe 参数用于区分是点击还是滑动触发
// direction 参数用于指示滑动方向，'left' 或 'right'
const prevQuestion = (isSwipe = false, direction = 'right') => {
  if (currentQuestionIndex.value > 0) {
    // #ifdef MP-WEIXIN
    runMPAnimation(direction);
    // #endif

    // #ifndef MP-WEIXIN
    transitionDirection.value = direction;
    currentQuestionIndex.value--;
    // selectedAnswer.value = questions.value[currentQuestionIndex.value].selectedAnswer || null;
    // #endif

  } else if (isSwipe) {
    console.log('已经是第一题，向右滑动');
  }
};

const goToQuestion = (index) => {
  if (index >= 0 && index < totalQuestions.value) {
    const direction = index > currentQuestionIndex.value ? 'left' : 'right';

    // #ifdef MP-WEIXIN
    // 对于直接跳转，可以考虑一个简单的淡入淡出或者无动画
    // 这里我们直接跳转并确保状态更新
    currentQuestionIndex.value = index;
    // Removed assignment to selectedAnswer.value
    // selectedAnswer.value = questions.value[currentQuestionIndex.value].selectedAnswer || null;
     toggleQuestionCard(); // 关闭答题卡
    // #endif

    // #ifndef MP-WEIXIN
    transitionDirection.value = direction;
    currentQuestionIndex.value = index;
    // Removed assignment to selectedAnswer.value
    // selectedAnswer.value = questions.value[currentQuestionIndex.value].selectedAnswer || null;
     toggleQuestionCard(); // 关闭答题卡
    // #endif

  } else {
    toggleQuestionCard();
  }
};

// 触摸/滑动检测相关的变量
const touchStartX = ref(0);
const touchEndX = ref(0);
const touchStartY = ref(0);
const touchEndY = ref(0);
const touchThreshold = 50; // 触发滑动的最小水平距离

const handleTouchStart = (event) => {
  // 检查是否点击在选项上
  const target = event.target || event.currentTarget;
  // #ifdef H5
  if (target.classList && (target.classList.contains('choice-item') || 
      target.classList.contains('option-label') || 
      target.classList.contains('option-text'))) {
    touchStartX.value = 0;
    touchStartY.value = 0;
    touchEndX.value = 0;
    touchEndY.value = 0;
    return;
  }
  // #endif

  // #ifdef MP-WEIXIN
  // 小程序环境下，通过类名判断
  const className = target.className || '';
  if (typeof className === 'string' && (
      className.includes('choice-item') || 
      className.includes('option-label') || 
      className.includes('option-text'))) {
    touchStartX.value = 0;
    touchStartY.value = 0;
    touchEndX.value = 0;
    touchEndY.value = 0;
    return;
  }
  // #endif

  touchStartX.value = event.touches[0].clientX;
  touchStartY.value = event.touches[0].clientY;
  touchEndX.value = touchStartX.value;
  touchEndY.value = touchStartY.value;
};

const handleTouchMove = (event) => {
   // Only track move if swipe tracking was initiated (i.e., not started on an option)
   if (touchStartX.value !== 0 || touchStartY.value !== 0) {
      touchEndX.value = event.touches[0].clientX;
      touchEndY.value = event.touches[0].clientY;
   }
};

const handleTouchEnd = () => {
  // Only process if swipe tracking was initiated
  if (touchStartX.value === 0 && touchStartY.value === 0) {
    return;
  }

  const deltaX = touchEndX.value - touchStartX.value;
  const deltaY = touchEndY.value - touchStartY.value;

  // 判断是否为有效的水平滑动 (水平距离大于阈值，并且水平距离大于垂直距离)
  if (Math.abs(deltaX) > touchThreshold && Math.abs(deltaX) > Math.abs(deltaY)) {
    if (deltaX < 0) {
      nextQuestion(true, 'left');
    } else {
      prevQuestion(true, 'right');
    }
  }

  // 重置触摸位置
  touchStartX.value = 0;
  touchStartY.value = 0;
  touchEndX.value = 0;
  touchEndY.value = 0;
};

// 获取 content-header 的高度 (仅在需要的平台使用 uni.createSelectorQuery)
const contentHeaderRef = ref(null);
const contentHeaderHeight = ref(0);

const getContentHeaderHeight = () => {
    // #ifdef MP-WEIXIN || H5 || APP-VUE
    // 使用 nextTick 确保 DOM 已经更新，并延迟获取确保渲染完成
    nextTick(() => {
        setTimeout(() => {
             uni.createSelectorQuery().select('.content-header').boundingClientRect(rect => {
                if (rect && rect.height) {
                    contentHeaderHeight.value = rect.height;
                     console.log('contentHeaderHeight:', contentHeaderHeight.value);
                }
            }).exec();
        }, 50);
    });
    // #endif
    // #ifndef MP-WEIXIN || H5 || APP-VUE
    // 其他平台可能需要其他方式获取元素高度
     console.warn('当前平台获取元素高度的方法未实现，请手动调整样式或实现对应平台的元素高度获取。');
    // #endif
};

const selectOption = (value) => {
    if (!value) {
        console.warn('选项值未定义');
        return;
    }
    
    // 找到当前题目对象并更新其 selectedAnswer 属性
    const currentQ = questions.value[currentQuestionIndex.value];
    if (currentQ) {
        currentQ.selectedAnswer = value;
        console.log('已选择答案:', value);
    }

    // 设置点击标志
    optionClickedRecently.value = true;
    setTimeout(() => {
        optionClickedRecently.value = false;
    }, 200);
};

// 答题卡显示/隐藏切换
const toggleQuestionCard = () => {
  showQuestionCard.value = !showQuestionCard.value;
};

// 交卷并查看结果（待实现）
const submitExam = () => {
  console.log('交卷并查看结果 clicked');
  // TODO: 实现交卷逻辑，收集用户答案，发送到后端，跳转到结果页面并传递答题数据
  const userAnswer = questions.value.map(q => ({ id: q.id, selectedAnswer: q.selectedAnswer }));
  console.log('用户答案:', userAnswer);
  // 示例跳转到结果页面
  // uni.navigateTo({ url: '/pages/exam/result', success: (res) => { res.eventChannel.emit('acceptResultData', { userAnswer: userAnswer, paperTitle: paperTitle.value }); } });
};

// 倒计时逻辑
const startTimer = () => {
  timer.value = setInterval(() => {
    if (timeRemaining.value > 0) {
      timeRemaining.value--;
    } else {
       clearInterval(timer.value);
       // TODO: 倒计时结束，自动交卷或提示用户
       console.log('倒计时结束');
       // 例如：自动提交
       // submitExam();
    }
  }, 1000);
};

const stopTimer = () => {
  if (timer.value) {
    clearInterval(timer.value);
    timer.value = null;
  }
};

// 返回上一页
const goBack = () => {
  // 停止倒计时
  stopTimer();
  // 返回上一页
  uni.navigateBack();
};

onMounted(() => {
  // 获取胶囊按钮位置信息 (用于计算header高度)
  // #ifdef MP-WEIXIN
  const menuButtonInfo = wx.getMenuButtonBoundingClientRect();
  menuButtonHeight.value = menuButtonInfo.height;
  menuButtonTop.value = menuButtonInfo.top;
  // #endif

  // 加载模拟数据
  loadMockData();

  // 启动倒计时
  startTimer();

  // 获取 content-header 的高度
  getContentHeaderHeight();

  // 初始化小程序动画实例
  initMPAnimation();
});

onUnmounted(() => {
  stopTimer(); // 页面卸载时停止倒计时
});

</script>

<style lang="scss">
/* 页面容器 */
.exam-answering-container {
  padding: 0 20rpx 20rpx 20rpx;
  background: linear-gradient(135deg, #f8f8ff 0%, #e0e7ff 100%);
  min-height: 100vh;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

/* 自定义头部 */
.header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20rpx;
  width: 100%;
  box-sizing: border-box;
  background: linear-gradient(135deg, #f8f8ff 0%, #e0e7ff 100%);
  margin-top: 0;

  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  /* height and padding-top are applied via :style */
}

.left-section {
    display: flex;
    align-items: center;
     height: 100%;
}

/* 右侧占位符样式 */
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

/* 题目内容区域容器 */
.question-content-wrapper {
    flex: 1;
    margin-top: 0;
    padding-bottom: 20rpx;
    
    position: relative;
    overflow: hidden;
     min-height: 0;
     display: flex;
     flex-direction: column;
}

/* 内容头部（包含试卷名称和图标行）*/
.content-header {
    margin-bottom: 30rpx;
    padding: 0 20rpx;
}

.paper-title-in-content {
    font-size: 36rpx;
    font-weight: bold;
    color: #333;
    text-align: center;
    margin-bottom: 20rpx;
}

.content-header-icons {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 20rpx;
}

.question-counter {
    font-size: 28rpx;
    color: #555;
}

.header-icon {
    cursor: pointer;
}

.countdown {
    font-size: 28rpx;
    color: #e45656;
    margin-left: 10rpx;
}

/* 题目内容区域（进行过渡动画的元素）*/
.question-content {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    /* top is set dynamically via :style */
    overflow-y: auto;
    width: 100%;
    height: calc(100% - v-bind(contentHeaderHeight + 'px'));
    will-change: transform;
}

.question-main {
    padding: 0 20rpx;
}

.question-text {
  font-size: 32rpx;
  color: #333;
  margin-bottom: 20rpx;
  line-height: 1.6;
  word-break: break-word;
}

.question-image {
  width: 100%;
  margin-bottom: 20rpx;
  border-radius: 8rpx;
}

.answer-area {
    margin-top: 30rpx;
}

.choice-item {
  background-color: #fff;
  border: 1rpx solid #eee;
  border-radius: 8rpx;
  padding: 20rpx;
  margin-bottom: 15rpx;
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: background-color 0.2s ease-in-out, border-color 0.2s ease-in-out;

  &:last-child {
    margin-bottom: 0;
  }

  &.selected {
    background-color: #e0e7ff;
    border-color: #007aff;
  }
}

.option-label {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  margin-right: 20rpx;
}

.option-text {
  font-size: 30rpx;
  color: #555;
  flex: 1;
  word-break: break-word;
}

.unsupported-tip {
  background-color: #fff;
  border: 1rpx dashed #ccc;
  border-radius: 8rpx;
  padding: 30rpx;
  text-align: center;
  color: #999;
  font-size: 28rpx;
  line-height: 1.5;
  display: flex;
  flex-direction: column;
}

/* 答题卡覆盖层样式 */
.question-card-overlay {
  position: fixed;
  top: v-bind(headerHeight);
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  visibility: hidden;
  opacity: 0;
  transition: visibility 0.3s ease-in-out, opacity 0.3s ease-in-out;

  &.show {
    visibility: visible;
    opacity: 1;
  }
}

.question-card-content {
  width: 100%;
  background-color: #fff;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx;
  border-bottom: 1rpx solid #eee;
}

.card-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}

.card-body {
  flex: 1;
  padding: 20rpx;
  overflow-y: auto;
}

.question-type-section {
  margin-bottom: 20rpx;
}

.type-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 15rpx;
  display: block;
}

.question-number-list {
  display: flex;
  flex-wrap: wrap;
  gap: 60rpx;
}

.question-number-item {
  width: 90rpx;
  height: 90rpx;
  border: 1rpx solid #ccc;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 28rpx;
  color: #555;
  cursor: pointer;

  &.answered {
    background-color: #007aff;
    color: #fff;
    border-color: #007aff;
  }
}

.card-footer {
  padding: 20rpx;
  border-top: 1rpx solid #eee;
}

.submit-button {
  background-color: #e45656;
  color: #fff;
  font-size: 32rpx;
  padding: 15rpx 0;
  border-radius: 50rpx;
  text-align: center;
  cursor: pointer;
}

/* 为非小程序平台添加过渡动画样式 */
/* #ifndef MP-WEIXIN */
/* 滑动过渡动画效果 */
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
    transition: transform 0.3s ease;
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
}

.slide-left-leave-active,
.slide-right-leave-active {
    z-index: 1;
}

.slide-left-enter-active,
.slide-right-enter-active {
    z-index: 2;
}

/* 向左滑动动画（下一题） */
.slide-left-enter-from {
    transform: translateX(100%);
}

.slide-left-leave-to {
    transform: translateX(-100%);
}

/* 向右滑动动画（上一题） */
.slide-right-enter-from {
    transform: translateX(-100%);
}

.slide-right-leave-to {
    transform: translateX(100%);
}
/* #endif */

/* 小程序环境下的动画样式 */
/* #ifdef MP-WEIXIN */
.question-content {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    overflow-y: auto;
    width: 100%;
    height: calc(100% - v-bind(contentHeaderHeight + 'px'));
    will-change: transform;
}

.question-main {
    padding: 20rpx;
    background-color: #fff;
    min-height: 100%;
    box-sizing: border-box;
}
/* #endif */

</style> 