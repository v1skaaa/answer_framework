import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getQuestionList } from '@/api/exam'

// 解析数学公式文本的辅助函数
const parseMathText = (text) => {
  if (!text || typeof text !== 'string') {
    return []
  }
  
  const segments = []
  let currentIndex = 0
  
  while (currentIndex < text.length) {
    // 查找下一个数学公式的开始位置
    let nextDisplayMath = text.indexOf('$$', currentIndex)
    let nextInlineMath = text.indexOf('$', currentIndex)
    
    // 如果找到了 $$，检查它是否在 $ 之前
    if (nextDisplayMath !== -1 && (nextInlineMath === -1 || nextDisplayMath <= nextInlineMath)) {
      // 处理 display math $$...$$
      
      // 添加之前的文本
      if (nextDisplayMath > currentIndex) {
        const textContent = text.substring(currentIndex, nextDisplayMath)
        if (textContent.trim()) {
          segments.push({
            type: 'text',
            content: textContent
          })
        }
      }
      
      // 查找对应的结束 $$
      const endDisplayMath = text.indexOf('$$', nextDisplayMath + 2)
      if (endDisplayMath !== -1) {
        const formulaContent = text.substring(nextDisplayMath + 2, endDisplayMath)
        if (formulaContent.trim()) {
          segments.push({
            type: 'formula',
            content: formulaContent.trim(),
            displayMode: true
          })
        }
        currentIndex = endDisplayMath + 2
      } else {
        // 没有找到结束的 $$，将其作为普通文本处理
        segments.push({
          type: 'text',
          content: text.substring(currentIndex)
        })
        break
      }
      
    } else if (nextInlineMath !== -1) {
      // 处理 inline math $...$
      
      // 添加之前的文本
      if (nextInlineMath > currentIndex) {
        const textContent = text.substring(currentIndex, nextInlineMath)
        if (textContent.trim()) {
          segments.push({
            type: 'text',
            content: textContent
          })
        }
      }
      
      // 查找对应的结束 $（但不能是 $$）
      let endInlineMath = -1
      let searchIndex = nextInlineMath + 1
      
      while (searchIndex < text.length) {
        const nextDollar = text.indexOf('$', searchIndex)
        if (nextDollar === -1) break
        
        // 检查是否是 $$（应该跳过）
        if (text.charAt(nextDollar + 1) === '$') {
          searchIndex = nextDollar + 2
          continue
        }
        
        endInlineMath = nextDollar
        break
      }
      
      if (endInlineMath !== -1) {
        const formulaContent = text.substring(nextInlineMath + 1, endInlineMath)
        if (formulaContent.trim()) {
          segments.push({
            type: 'formula',
            content: formulaContent.trim(),
            displayMode: false
          })
        }
        currentIndex = endInlineMath + 1
      } else {
        // 没有找到结束的 $，将其作为普通文本处理
        segments.push({
          type: 'text',
          content: text.substring(currentIndex)
        })
        break
      }
      
    } else {
      // 没有找到更多的数学公式，添加剩余文本
      const textContent = text.substring(currentIndex)
      if (textContent.trim()) {
        segments.push({
          type: 'text',
          content: textContent
        })
      }
      break
    }
  }
  
  // 如果没有找到任何公式，返回整个文本作为文本段
  if (segments.length === 0 && text.trim()) {
    segments.push({ 
      type: 'text', 
      content: text 
    })
  }
  
  return segments
}

export const useExamStore = defineStore('exam', () => {
  // 状态
  const questions = ref([])
  const currentQuestionIndex = ref(0)
  const paperTitle = ref('')
  const timeRemaining = ref(3600)
  const timer = ref(null)
  const showQuestionCard = ref(false)

  // 计算属性
  const totalQuestions = computed(() => questions.value.length)
  const currentQuestion = computed(() => questions.value[currentQuestionIndex.value] || {})

  // 答题卡数据结构
  const questionTypes = computed(() => {
    const types = {}
    if (!questions.value || questions.value.length === 0) {
      return []
    }
    questions.value.forEach(q => {
      if (!types[q.type]) {
        types[q.type] = { 
          name: q.type === 'choice' ? '选择题' : q.type === 'fill' ? '填空题' : '解答题', 
          count: 0, 
          questions: [] 
        }
      }
      types[q.type].count++
      let answeredStatus = false
      if (q.type === 'choice') {
        answeredStatus = !!(q.selectedAnswers && q.selectedAnswers.length)
      } else {
        answeredStatus = !!q.selectedAnswer
      }
      types[q.type].questions.push({ 
        number: q.number, 
        index: q.index, 
        answered: answeredStatus 
      })
    })
    const orderedTypes = []
    if (types['choice']) orderedTypes.push(types['choice'])
    if (types['fill']) orderedTypes.push(types['fill'])
    if (types['application']) orderedTypes.push(types['application'])
    for (const typeKey in types) {
      if (!['choice', 'fill', 'application'].includes(typeKey)) {
        orderedTypes.push(types[typeKey])
      }
    }
    return orderedTypes
  })

  // 格式化时间
  const formattedTime = computed(() => {
    const minutes = Math.floor(timeRemaining.value / 60)
    const seconds = timeRemaining.value % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  })

  // 方法
  const loadQuestions = async (sourceId) => {
    if (!sourceId) {
      console.warn('No sourceId provided for loading questions.')
      questions.value = []
      return
    }

    try {
      const res = await getQuestionList(sourceId)
      if (res.flag === '1' && res.result) {
        const allQuestions = [];

        // Process choice questions
        if (res.result.choiceQuestions) {
          res.result.choiceQuestions.forEach((item) => {
            allQuestions.push({
              id: item.qcId,
              number: item.queSort,
              type: 'choice',
              textSegments: item.queStem ? parseMathText(item.queStem) : [],
              options: [
                { label: 'A', segments: item.optionA ? parseMathText(item.optionA) : [], value: 'A' },
                { label: 'B', segments: item.optionB ? parseMathText(item.optionB) : [], value: 'B' },
                { label: 'C', segments: item.optionC ? parseMathText(item.optionC) : [], value: 'C' },
                { label: 'D', segments: item.optionD ? parseMathText(item.optionD) : [], value: 'D' },
              ],
              selectedAnswers: [], // For multiple choice, use an array
              // index will be assigned after sorting
            });
          });
        }

        // Process blank questions
        if (res.result.blankQuestions) {
           res.result.blankQuestions.forEach((item) => {
            allQuestions.push({
              id: item.qbId,
              number: item.queSort,
              type: 'fill',
              textSegments: item.queStem ? parseMathText(item.queStem) : [],
              options: [], // Blank questions have no options in this format
              selectedAnswer: '', // Use a single value for fill-in-the-blank
              // index will be assigned after sorting
            });
          });
        }

        // Process application questions
         if (res.result.applicationQuestions) {
           res.result.applicationQuestions.forEach((item) => {
            allQuestions.push({
              id: item.qaId,
              number: item.queSort,
              type: 'application',
              textSegments: item.queStem ? parseMathText(item.queStem) : [],
              options: [], // Application questions have no options
              selectedAnswer: '', // Use a single value for application questions
              // index will be assigned after sorting
            });
          });
        }

        // Sort questions by queSort (now mapped to 'number')
        allQuestions.sort((a, b) => a.number - b.number);

        // Assign index after sorting
        questions.value = allQuestions.map((q, index) => ({ ...q, index }));

        // TODO: Determine paper title from response if available
        // if (res.result.paperName) {
        //   paperTitle.value = res.result.paperName;
        // } else {
          paperTitle.value = '试卷名称'; // Default title
        // }

      } else {
        console.error('Failed to load questions:', res.msg)
        uni.showToast({
          title: res.msg || '获取题目失败',
          icon: 'none'
        })
        questions.value = []
      }
    } catch (error) {
      console.error('Error fetching questions:', error)
      uni.showToast({
        title: '获取题目异常',
        icon: 'none'
      })
      questions.value = []
    }
  }

  const selectOption = (value) => {
    if (!value) {
      console.warn('选项值未定义')
      return
    }
    
    const currentQ = questions.value[currentQuestionIndex.value]
    if (currentQ) {
      if (currentQ.type === 'choice') {
        const index = currentQ.selectedAnswers.indexOf(value)
        if (index > -1) {
          currentQ.selectedAnswers.splice(index, 1)
        } else {
          currentQ.selectedAnswers.push(value)
        }
        currentQ.selectedAnswers.sort()
        console.log(`Question ${currentQ.number}: Selected option ${value}. Current selections:`, currentQ.selectedAnswers)
      } else {
        currentQ.selectedAnswer = value
        console.log(`Question ${currentQ.number}: Selected answer ${value}. Current answer:`, currentQ.selectedAnswer)
      }
    }
  }

  // For fill-in-the-blank or application questions that might have a single answer input
  const updateSelectedAnswer = (value) => {
    const currentQ = questions.value[currentQuestionIndex.value]
    if (currentQ && (currentQ.type === 'fill' || currentQ.type === 'application')) {
      currentQ.selectedAnswer = value
    }
  }

  const nextQuestion = () => {
    if (currentQuestionIndex.value < totalQuestions.value - 1) {
      currentQuestionIndex.value++
    }
  }

  const prevQuestion = () => {
    if (currentQuestionIndex.value > 0) {
      currentQuestionIndex.value--
    }
  }

  const goToQuestion = (index) => {
    if (index >= 0 && index < totalQuestions.value) {
      currentQuestionIndex.value = index
      showQuestionCard.value = false
    }
  }

  const toggleQuestionCard = () => {
    showQuestionCard.value = !showQuestionCard.value
  }

  const startTimer = () => {
    if (timer.value) return
    timer.value = setInterval(() => {
      if (timeRemaining.value > 0) {
        timeRemaining.value--
      } else {
        stopTimer()
        // TODO: Handle exam submission automatically when time runs out
        console.log('时间到！')
      }
    }, 1000)
  }

  const stopTimer = () => {
    if (timer.value) {
      clearInterval(timer.value)
      timer.value = null
    }
  }

  const submitExam = () => {
    stopTimer()
    console.log('提交考试')
    // TODO: Implement actual submission logic
    // Access questions.value to get all questions and user's answers
    console.log('所有题目及答案:', questions.value.map(q => ({
      id: q.id,
      number: q.number,
      type: q.type,
      selected: q.type === 'choice' ? q.selectedAnswers : q.selectedAnswer,
      correctAnswer: q.correctAnswer // Note: correctAnswer is not in the provided API response, you might need to adjust or fetch separately if needed for grading.
    })));

    // Example: Navigate to result page
    // uni.redirectTo({
    //   url: '/pages/exam/result/index'
    // });

    uni.showModal({
      title: '交卷确认',
      content: '确定要提交试卷吗？',
      success: (res) => {
        if (res.confirm) {
          console.log('用户点击确定');
          // TODO: Call API to submit answers
          uni.showToast({
            title: '交卷成功 (模拟)',
            icon: 'success'
          });
           // Example: Navigate to result page after submission
            uni.redirectTo({
             url: '/pages/exam/result/index' // Replace with your actual result page path
            });
        } else if (res.cancel) {
          console.log('用户点击取消');
        }
      }
    });
  }

  return {
    // 状态
    questions,
    currentQuestionIndex,
    paperTitle,
    timeRemaining,
    timer,
    showQuestionCard,
    
    // 计算属性
    totalQuestions,
    currentQuestion,
    questionTypes,
    formattedTime,
    
    // 方法
    loadQuestions,
    selectOption,
    updateSelectedAnswer,
    nextQuestion,
    prevQuestion,
    goToQuestion,
    toggleQuestionCard,
    startTimer,
    stopTimer,
    submitExam
  }
}) 