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
    if (types['text']) orderedTypes.push(types['text'])
    for (const typeKey in types) {
      if (!['choice', 'fill', 'text'].includes(typeKey)) {
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
        questions.value = res.result.map((item, index) => ({
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
          selectedAnswers: [],
          index: index
        }))
        // 从第一个题目中获取试卷名称
        // if (res.result.length > 0 && res.result[0].paperName) {
        //   paperTitle.value = res.result[0].paperName
        // } else {
        //   paperTitle.value = '试卷名称'
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
      } else {
        currentQ.selectedAnswer = value
      }
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
    timer.value = setInterval(() => {
      if (timeRemaining.value > 0) {
        timeRemaining.value--
      } else {
        clearInterval(timer.value)
        console.log('倒计时结束')
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
    const userAnswer = questions.value.map(q => ({
      id: q.id,
      selectedAnswers: q.selectedAnswers
    }))
    const examData = {
      userAnswer: userAnswer,
      questions: questions.value,
      paperTitle: paperTitle.value,
      startTime: Date.now() - (3600 - timeRemaining.value) * 1000
    }

    uni.navigateTo({
      url: '/pages/exam/result/index',
      success: (res) => {
        res.eventChannel.emit('acceptResultData', examData)
      },
      fail: (err) => {
        console.error('跳转到结果页面失败:', err)
      }
    })
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
    nextQuestion,
    prevQuestion,
    goToQuestion,
    toggleQuestionCard,
    startTimer,
    stopTimer,
    submitExam
  }
}) 