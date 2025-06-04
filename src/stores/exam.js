import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getQuestionList } from '@/api/exam'
import { submitExamComplete } from '@/api/exam'
import { useUserStore } from '@/stores/user'

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
  const uploadedImages = ref({}) // 存储每个题目的上传图片
  const paperId = ref(null) // 新增存储试卷ID的状态
  const favoritedQuestionIds = ref(new Set()) // 存储被收藏题目的ID集合

  // 计算属性
  const totalQuestions = computed(() => questions.value.length)
  const currentQuestion = computed(() => questions.value[currentQuestionIndex.value] || {})

  // 获取当前题目的上传图片
  const currentQuestionImages = computed(() => {
    const questionId = currentQuestion.value.id
    return uploadedImages.value[questionId] || []
  })

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
      } else if (q.type === 'fill' || q.type === 'application') {
        // 检查是否有答案或上传的图片
        answeredStatus = !!(q.selectedAnswer || (uploadedImages.value[q.id] && uploadedImages.value[q.id].length > 0))
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
    console.log('loadQuestions called with sourceId:', sourceId);
    if (!sourceId) {
      console.warn('No sourceId provided for loading questions.')
      questions.value = []
      paperId.value = null; // Clear paperId
      return
    }

    // 直接将传入的 sourceId 设置为 paperId
    paperId.value = sourceId;
    console.log('Setting paperId from sourceId parameter:', paperId.value);

    try {
      console.log('Calling getQuestionList API...');
      const res = await getQuestionList(sourceId)
      console.log('getQuestionList API response:', res);
      if (res.flag === '1' && res.result) {
        console.log('API call successful, res.result:', res.result);

        const allQuestions = [];

        // Process choice questions
        if (res.result.choiceQuestions) {
          res.result.choiceQuestions.forEach((item) => {
            allQuestions.push({
              id: item.qcId,
              number: item.queSort,
              type: 'choice',
              choiceType: item.choiceType,
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
        // 根据 choiceType 判断是单选还是多选
        if (currentQ.choiceType === 1) {
          // 单选题：直接设置选中的答案
          currentQ.selectedAnswers = [value]
        } else if (currentQ.choiceType === 2) {
          // 多选题：切换选中状态
        const index = currentQ.selectedAnswers.indexOf(value)
        if (index > -1) {
          currentQ.selectedAnswers.splice(index, 1)
        } else {
          currentQ.selectedAnswers.push(value)
        }
        currentQ.selectedAnswers.sort()
        }
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

  const submitExam = async () => {
    stopTimer()
    console.log('准备提交考试')
    
    if (!paperId.value) {
      console.error('无法提交考试：缺少 paperId');
      uni.showToast({
        title: '无法提交考试：缺少试卷ID',
        icon: 'none'
      });
      return;
    }

    // 从 user store 获取 studentId
    const userStore = useUserStore();
    const studentId = userStore.id;
    if (!studentId) {
      console.error('无法提交考试：缺少 studentId，用户可能未登录');
      uni.showToast({
        title: '无法提交考试：请先登录',
        icon: 'none'
      });
      return;
    }

    // 构建请求体
    const submissionData = {
      paperId: paperId.value,
      studentId: studentId, // 从 user store 获取的 studentId
      choiceAnswerDetails: [],
      blankAnswerDetails: [],
      applicationAnswerDetails: []
    };

    questions.value.forEach(q => {
      if (q.type === 'choice') {
        if (q.selectedAnswers && q.selectedAnswers.length > 0) {
          // 格式化选择题答案，多选直接连接
          const stuAnswer = q.selectedAnswers.join('');
          submissionData.choiceAnswerDetails.push({
            queSort: q.number,
            stuAnswer: stuAnswer,
            timeSpent: null // 暂时设置为 null
          });
        }
      } else if (q.type === 'fill') {
        // 处理填空题的图片上传
        const images = uploadedImages.value[q.id] || [];
        if (images.length > 0) {
          images.forEach(image => {
             submissionData.blankAnswerDetails.push({
              queSort: q.number,
              stuAnswer: null, // 暂时设置为 null
              imageUrls: null, // 暂时设置为 null
              imageDataBase64: image.base64, // 使用存储的base64编码
              timeSpent: null // 暂时设置为 null
            });
          });
        } else if (q.selectedAnswer) {
             // 如果有文本答案，处理文本答案 (如果填空题支持文本输入)
             // 注意：根据你的需求，填空题目前主要支持图片上传，
             // 如果有文本输入的需求，需要在这里添加处理逻辑
             console.warn(`Question ${q.number} (fill) contains non-image answer, text submission not implemented.`);
        }
      } else if (q.type === 'application') {
        // 处理解答题的图片上传
         const images = uploadedImages.value[q.id] || [];
        if (images.length > 0) {
          images.forEach(image => {
             submissionData.applicationAnswerDetails.push({
              queSort: q.number,
              stuAnswer: null, // 暂时设置为 null
              imageUrls: null, // 暂时设置为 null
              imageDataBase664: image.base64, // 使用存储的base64编码
              timeSpent: null // 暂时设置为 null
            });
          });
        } else if (q.selectedAnswer) {
             // 如果有文本答案，处理文本答案 (如果解答题支持文本输入)
             // 注意：根据你的需求，解答题目前主要支持图片上传，
             // 如果有文本输入的需求，需要在这里添加处理逻辑
              console.warn(`Question ${q.number} (application) contains non-image answer, text submission not implemented.`);
        }
      }
    });

    console.log('提交数据:', submissionData);

    try {
      const response = await submitExamComplete(submissionData);
      console.log('提交接口响应:', response);
      
      // TODO: 根据提交接口的实际响应进行处理
      if (response && response.flag === '1') { // 假设 flag === '1' 表示成功
          uni.showToast({
            title: response.msg || '交卷成功',
            icon: 'success'
          });
          // 导航到结果页面或其他后续页面
            uni.redirectTo({
            url: '/pages/exam/result/index' // 请替换为你的实际结果页路径
          });
      } else {
         // 处理提交失败
         uni.showModal({
           title: '提交失败',
           content: response.msg || '试卷提交失败，请稍后再试。',
           showCancel: false
         });
      }

    } catch (error) {
      console.error('提交考试异常:', error);
      uni.showModal({
        title: '提交失败',
        content: '试卷提交过程中发生异常，请稍后再试。',
        showCancel: false
      });
    }
  }

  // 图片上传相关方法
  const uploadImage = async (tempFilePath) => {
    try {
      // 打印图片信息
      console.log('准备上传的图片信息:', {
        tempFilePath,
        fileType: tempFilePath.split('.').pop(), // 获取文件扩展名
        timestamp: new Date().toISOString()
      });

      // 获取图片详细信息
      const imageInfo = await uni.getImageInfo({
        src: tempFilePath
      });
      console.log('图片详细信息:', {
        width: imageInfo.width,
        height: imageInfo.height,
        path: imageInfo.path,
        type: imageInfo.type,
        size: imageInfo.size // 注意：某些平台可能不支持获取文件大小
      });

      // 将图片转换为 base64
      const base64 = await new Promise((resolve, reject) => {
        // #ifdef H5
        const xhr = new XMLHttpRequest();
        xhr.open('GET', tempFilePath, true);
        xhr.responseType = 'blob';
        xhr.onload = function() {
          if (this.status === 200) {
            const reader = new FileReader();
            reader.onloadend = function() {
              // 移除 data:image/jpeg;base64, 前缀
              const base64Data = reader.result.split(',')[1];
              resolve(base64Data);
            };
            reader.readAsDataURL(this.response);
          } else {
            reject(new Error('Failed to load image'));
          }
        };
        xhr.onerror = function() {
          reject(new Error('Failed to load image'));
        };
        xhr.send();
        // #endif

        // #ifndef H5
        uni.getFileSystemManager().readFile({
          filePath: tempFilePath,
          encoding: 'base64',
          success: (res) => {
            resolve(res.data);
          },
          fail: (error) => {
            console.error('读取文件失败:', error);
            reject(error);
          }
        });
        // #endif
      });

      // 打印 base64 编码（只显示前100个字符，避免控制台输出过多）
      console.log('图片 base64 编码(前100个字符):', base64.substring(0, 100) + '...');
      console.log('base64 完整长度:', base64.length);

      // 这里应该调用实际的上传API
      // const res = await uploadFile(tempFilePath)
      // 模拟上传成功
      const questionId = currentQuestion.value.id
      if (!uploadedImages.value[questionId]) {
        uploadedImages.value[questionId] = []
      }
      
      // 添加图片到当前题目的图片列表
      const imageData = {
        url: tempFilePath, // 实际项目中应该是上传后的URL
        tempFilePath: tempFilePath,
        uploadTime: new Date().toISOString(),
        imageInfo: imageInfo, // 保存图片信息
        base64: base64 // 保存 base64 编码
      };
      
      uploadedImages.value[questionId].push(imageData);
      console.log('当前题目的所有图片:', uploadedImages.value[questionId]);

      // 更新当前题目的状态和答案
      const currentQ = questions.value[currentQuestionIndex.value];
      if (currentQ && (currentQ.type === 'fill' || currentQ.type === 'application')) {
        // 如果题目还没有答案，创建一个新的答案对象
        if (!currentQ.selectedAnswer) {
          currentQ.selectedAnswer = {
            type: 'image',
            images: []
          };
        }
        // 如果答案不是图片类型，转换为图片类型
        if (typeof currentQ.selectedAnswer === 'string') {
          currentQ.selectedAnswer = {
            type: 'image',
            images: []
          };
        }
        // 添加图片的 base64 编码到答案中
        currentQ.selectedAnswer.images.push({
          base64: base64,
          uploadTime: new Date().toISOString(),
          imageInfo: imageInfo
        });
        console.log('当前题目的答案:', currentQ.selectedAnswer);
      }

      return true
    } catch (error) {
      console.error('上传图片失败:', error)
      uni.showToast({
        title: '上传图片失败',
        icon: 'none'
      })
      return false
    }
  }

  const removeImage = (questionId, imageIndex) => {
    if (uploadedImages.value[questionId]) {
      uploadedImages.value[questionId].splice(imageIndex, 1)
      
      // 更新题目的答案
      const currentQ = questions.value[currentQuestionIndex.value];
      if (currentQ && (currentQ.type === 'fill' || currentQ.type === 'application')) {
        if (currentQ.selectedAnswer && currentQ.selectedAnswer.type === 'image') {
          currentQ.selectedAnswer.images.splice(imageIndex, 1);
          // 如果没有图片了，清除答案
          if (currentQ.selectedAnswer.images.length === 0) {
            currentQ.selectedAnswer = '';
        }
      }
      }
    }
  }

  const clearImages = (questionId) => {
    if (uploadedImages.value[questionId]) {
      uploadedImages.value[questionId] = []
      
      // 清除题目的答案
      const currentQ = questions.value[currentQuestionIndex.value];
      if (currentQ && (currentQ.type === 'fill' || currentQ.type === 'application')) {
        currentQ.selectedAnswer = '';
      }
    }
  }

  // 切换题目收藏状态
  const toggleFavorite = (questionId) => {
    if (questionId) {
      if (favoritedQuestionIds.value.has(questionId)) {
        favoritedQuestionIds.value.delete(questionId);
        console.log(`取消收藏题目: ${questionId}`);
      } else {
        favoritedQuestionIds.value.add(questionId);
        console.log(`收藏题目: ${questionId}`);
      }
      console.log('当前收藏列表:', Array.from(favoritedQuestionIds.value));
    } else {
      console.warn('无法收藏题目：缺少题目ID');
    }
  }

  return {
    // 状态
    questions,
    currentQuestionIndex,
    paperTitle,
    timeRemaining,
    timer,
    showQuestionCard,
    uploadedImages,
    paperId,
    favoritedQuestionIds,
    
    // 计算属性
    totalQuestions,
    currentQuestion,
    questionTypes,
    formattedTime,
    currentQuestionImages,
    
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
    submitExam,
    uploadImage,
    removeImage,
    clearImages,
    toggleFavorite
  }
}) 