import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getQuestionList } from '@/api/exam'
import { submitExamComplete } from '@/api/exam'
import { useUserStore } from '@/stores/user'
import { getExamDetails } from '@/api/exam'

// 解析数学公式文本的辅助函数
const parseMathText = (text, imageUrlMap = {}) => {
  if (!text || typeof text !== 'string') {
    return [];
  }
  
  const segments = [];
  let currentIndex = 0;
  
  // Regex to find either $$...$$, $...$, or [IMAGE_ID:...] globally
  const combinedRegex = /(\$\$[\s\S]*?\$\$)|(\$[\s\S]*?\$)|(\[IMAGE_ID:([a-f0-9-]+)\])/g;
  
  let match;
  while ((match = combinedRegex.exec(text)) !== null) {
    const fullMatch = match[0];
    const matchIndex = match.index;

    // Add preceding text segment
    if (matchIndex > currentIndex) {
      const textContent = text.substring(currentIndex, matchIndex);
        if (textContent.trim()) {
        segments.push({ type: 'text', content: textContent });
        }
      }
      
    // Handle matched segment
    if (match[1]) {
      // Display math $$...$$
      segments.push({ type: 'formula', content: match[1].substring(2, match[1].length - 2).trim(), displayMode: true });
    } else if (match[2]) {
      // Inline math $...$
      segments.push({ type: 'formula', content: match[2].substring(1, match[2].length - 1).trim(), displayMode: false });
    } else if (match[3]) {
      // Image ID [IMAGE_ID:...] - match[3] is the full [IMAGE_ID:xxx] string, match[4] is the ID
      const imageId = match[4];
      const imageUrl = imageUrlMap[imageId];
      if (imageUrl) {
        segments.push({ type: 'image', url: imageUrl });
      } else {
        // If image URL not found, treat the placeholder as plain text
        segments.push({ type: 'text', content: fullMatch });
      }
    }
    
    currentIndex = matchIndex + fullMatch.length;
  }
  
  // Add any remaining text after the last match
  if (currentIndex < text.length) {
    const textContent = text.substring(currentIndex);
        if (textContent.trim()) {
      segments.push({ type: 'text', content: textContent });
        }
      }
      
  // If no patterns found and original text has content, return it as a single text segment
  if (segments.length === 0 && text.trim()) {
    segments.push({ type: 'text', content: text });
  }
  
  return segments;
};

// 处理图片ID的辅助函数
const processImageIds = (text, imageUrlMap) => {
  if (!text || !imageUrlMap) return text;
  
  // 使用正则表达式匹配 [IMAGE_ID:xxx] 格式
  const imageIdRegex = /\[IMAGE_ID:([a-f0-9-]+)\]/g;
  
  return text.replace(imageIdRegex, (match, imageId) => {
    // 在 imageUrlMap 中查找对应的URL
    const imageUrl = imageUrlMap[imageId];
    if (imageUrl) {
      // 如果找到对应的URL，返回图片标签，并将max-width直接写入行内样式并添加 !important
      return `<img src="${imageUrl}" style="max-width: 40% !important; height: auto; display: block; margin: 10rpx auto; border-radius: 8rpx;" />`;
    }
    // 如果没有找到对应的URL，保持原样
    return match;
  });
};

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
  const resultQuestionSummary = ref([])
  const score = ref(0)
  const totalScore = ref(0)
  const timeSpent = ref(0)
  const currentPushId = ref(null); // 新增 pushId 状态

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
  const loadQuestions = async (sourceId, pushId = null) => {
    console.log('loadQuestions called with sourceId:', sourceId, 'and pushId:', pushId);
    if (!sourceId) {
      console.warn('No sourceId provided for loading questions.')
      questions.value = []
      paperId.value = null; // Clear paperId
      uploadedImages.value = {}; // Clear uploaded images when loading new questions
      currentPushId.value = null; // Clear pushId as well
      return
    }

    // 直接将传入的 sourceId 设置为 paperId
    paperId.value = sourceId;
    currentPushId.value = pushId; // 存储 pushId
    console.log('Setting paperId from sourceId parameter:', paperId.value, 'and currentPushId:', currentPushId.value);

    try {
      console.log('Calling getQuestionList API...');
      const res = await getQuestionList(sourceId)
      console.log('getQuestionList API response:', res);
      if (res.flag === '1' && res.result) {
        console.log('API call successful, res.result:', res.result);

        const allQuestions = [];
        const imageUrlMap = res.result.imageUrlMap || {}; // Ensure imageUrlMap is obtained

        // Process choice questions
        if (res.result.choiceQuestions) {
          res.result.choiceQuestions.forEach((item) => {
            // Pass imageUrlMap to parseMathText for both stem and options
            const questionTextSegments = item.queStem ? parseMathText(item.queStem, imageUrlMap) : [];

            // 如果是多选题 (choiceType === 2)，在题干前面添加提示
            if (item.choiceType === 2) {
              questionTextSegments.unshift({
                type: 'multipleChoicePrefix',
                content: '(多选题)'
              });
            }

            // Process options with imageUrlMap
            const processedOptions = [
              { label: 'A', segments: item.optionA ? parseMathText(item.optionA, imageUrlMap) : [], value: 'A' },
              { label: 'B', segments: item.optionB ? parseMathText(item.optionB, imageUrlMap) : [], value: 'B' },
              { label: 'C', segments: item.optionC ? parseMathText(item.optionC, imageUrlMap) : [], value: 'C' },
              { label: 'D', segments: item.optionD ? parseMathText(item.optionD, imageUrlMap) : [], value: 'D' },
            ];

            allQuestions.push({
              id: item.qcId,
              number: item.queSort,
              type: 'choice',
              choiceType: item.choiceType,
              textSegments: questionTextSegments,
              options: processedOptions,
              selectedAnswers: [], // For multiple choice, use an array
              score: item.score,
              // index will be assigned after sorting
            });
          });
        }

        // Process blank questions
        if (res.result.blankQuestions) {
           res.result.blankQuestions.forEach((item) => {
            // Pass imageUrlMap to parseMathText for stem
            allQuestions.push({
              id: item.qbId,
              number: item.queSort,
              type: 'fill',
              textSegments: item.queStem ? parseMathText(item.queStem, imageUrlMap) : [],
              options: [], // Blank questions have no options in this format
              selectedAnswer: '', // Use a single value for fill-in-the-blank
              score: item.score,
              // index will be assigned after sorting
            });
          });
        }

        // Process application questions
         if (res.result.applicationQuestions) {
           res.result.applicationQuestions.forEach((item) => {
            // Pass imageUrlMap to parseMathText for stem
            allQuestions.push({
              id: item.qaId,
              number: item.queSort,
              type: 'application',
              textSegments: item.queStem ? parseMathText(item.queStem, imageUrlMap) : [],
              options: [], // Application questions have no options
              selectedAnswer: '', // Use a single value for application questions
              score: item.score,
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
      pushId: currentPushId.value, // 使用 store 中的 currentPushId
      choiceAnswerDetails: [],
      blankAnswerDetails: [],
      applicationAnswerDetails: []
    };

    questions.value.forEach(q => {
      if (q.type === 'choice') {
        // Always include choice questions, set stuAnswer to null if no selection
        const stuAnswer = (q.selectedAnswers && q.selectedAnswers.length > 0) ? q.selectedAnswers.join('') : null;
        submissionData.choiceAnswerDetails.push({
          queSort: q.number,
          stuAnswer: stuAnswer,
          timeSpent: null // 暂时设置为 null
        });
      } else if (q.type === 'fill') {
        // Always include fill questions. Handle images or text answer.
        const images = uploadedImages.value[q.id] || [];
        
        // If there are uploaded images, combine them into a single entry
        if (images.length > 0) {
            // Combine all image base64 data with commas, keeping the data:image prefix
            const combinedBase64 = images.map(image => {
                // 如果 base64 数据已经包含前缀，直接使用
                if (image.base64.startsWith('data:')) {
                    return image.base64;
                }
                // 否则添加前缀
                return `data:image/jpeg;base64,${image.base64}`;
            }).join(',');
            console.log(`填空题 ${q.number} 的图片数据:`, {
                imageCount: images.length,
                combinedBase64Length: combinedBase64.length,
                firstImageBase64Preview: combinedBase64.substring(0, 100) + '...' // 只显示前100个字符
            });
                submissionData.blankAnswerDetails.push({
                    queSort: q.number,
                    stuAnswer: null, // stuAnswer is null when submitting image for fill
                    imageUrls: null, // Assuming imageUrls is not used yet
                imageDataBase64: combinedBase64, // Combined base64 data
                    timeSpent: null // 暂时设置为 null
            });
        } else if (q.selectedAnswer && typeof q.selectedAnswer === 'string' && q.selectedAnswer.trim() !== '') {
            // If there is a text answer, include it. Assuming fill supports text.
             submissionData.blankAnswerDetails.push({
                queSort: q.number,
                stuAnswer: q.selectedAnswer.trim(), // Include text answer
                imageUrls: null,
                imageDataBase64: null, // No image base64 for text answer
                timeSpent: null // 暂时设置为 null
            });
        } else {
            // If no image and no text answer, include with nulls
            submissionData.blankAnswerDetails.push({
                queSort: q.number,
                stuAnswer: null,
                imageUrls: null,
                imageDataBase64: null,
                timeSpent: null // 暂时设置为 null
            });
        }

      } else if (q.type === 'application') {
        // Always include application questions. Handle images or text answer.
         const images = uploadedImages.value[q.id] || [];

         // If there are uploaded images, combine them into a single entry
        if (images.length > 0) {
            // Combine all image base64 data with commas, keeping the data:image prefix
            const combinedBase64 = images.map(image => {
                // 如果 base64 数据已经包含前缀，直接使用
                if (image.base64.startsWith('data:')) {
                    return image.base64;
                }
                // 否则添加前缀
                return `data:image/jpeg;base64,${image.base64}`;
            }).join(',');
            console.log(`解答题 ${q.number} 的图片数据:`, {
                imageCount: images.length,
                combinedBase64Length: combinedBase64.length,
                firstImageBase64Preview: combinedBase64.substring(0, 100) + '...' // 只显示前100个字符
            });
             submissionData.applicationAnswerDetails.push({
              queSort: q.number,
              stuAnswer: null, // stuAnswer is null when submitting image for application
              imageUrls: null,
                imageDataBase64: combinedBase64, // Combined base64 data
              timeSpent: null // 暂时设置为 null
          });
        } else if (q.selectedAnswer && typeof q.selectedAnswer === 'string' && q.selectedAnswer.trim() !== '') {
            // If there is a text answer, include it. Assuming application supports text.
             submissionData.applicationAnswerDetails.push({
                queSort: q.number,
                stuAnswer: q.selectedAnswer.trim(), // Include text answer
                imageUrls: null,
                imageDataBase64: null,
                timeSpent: null // 暂时设置为 null
            });
        } else {
            // If no image and no text answer, include with nulls
             submissionData.applicationAnswerDetails.push({
                queSort: q.number,
                stuAnswer: null,
                imageUrls: null,
                imageDataBase64: null,
                timeSpent: null // 暂时设置为 null
            });
        }
      }
    });

    // 打印完整的提交数据结构
    console.log('提交数据:', JSON.stringify(submissionData, null, 2));

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
            url: '/pages/exam/result/index?recordId=' + response.result // 请替换为你的实际结果页路径，并加上recordId参数
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
    if (questionId && uploadedImages.value[questionId]) {
      uploadedImages.value[questionId] = [];
    }
  }

  // 清空所有图片缓存
  const resetUploadedImages = () => {
    uploadedImages.value = {};
    console.log('All uploaded images have been cleared');
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

  // 新增获取考试详情的 action
  const loadExamDetails = async (recordId) => {
    console.log('loadExamDetails called with recordId:', recordId);
    if (!recordId) {
      console.warn('No recordId provided for loading exam details.');
      // Optionally load mock data or show an error
      loadMockDataForResult();
      return;
    }

    try {
      console.log('Calling getExamDetails API...');
      const res = await getExamDetails(recordId);
      console.log('getExamDetails API response:', res);

      if (res.flag === '1' && res.result) {
        console.log('Exam details API call successful, res.result:', res.result);

        const allQuestions = [];
        let totalScoreAchieved = 0;
        let totalPaperScore = 0; // Calculate total possible score from paper
        const imageUrlMap = res.result.imageUrlMap || {}; // 获取imageUrlMap

        // Combine and process all question types
        const processQuestions = (questions, typeName, typeValue) => {
          if (questions) {
            questions.forEach(item => {
              let status = 'unanswered';
              let studentQuestionScore = 0; // Score for this specific question

              // Add question's total possible score to totalPaperScore
              totalPaperScore += item.question.score || 0;

              // Determine student's score for this question and status
              if (item.detailRecord && item.detailRecord.value !== null) {
                  studentQuestionScore = item.detailRecord.value;
              } else {
                  studentQuestionScore = 0; // Default to 0 if value is null or undefined
              }

              if (typeValue === 1) { // Choice questions
                if (item.detailRecord) {
                  // Add detailRecord.value to totalScoreAchieved for my score
                  if (item.detailRecord.value !== null) {
                    totalScoreAchieved += item.detailRecord.value;
                  }
                  // Determine individual question status (correct/incorrect/unanswered)
                  if (item.detailRecord.stuAnswer !== null) {
                   if (item.detailRecord.stuAnswer === item.question.correctAnswer) {
                      status = 'correct';
                   } else {
                       status = 'incorrect';
                   }
                } else {
                   status = 'unanswered';
                }
                }
              } else { // Fill-in-the-blank (2) and Application (3) questions
                // For fill-in-the-blank and application questions, status is always 'unanswered' as per previous logic.
                // Their score is NOT added to 'my score' (totalScoreAchieved) as per user's request for 'detailRecord.value'.
                 status = 'unanswered';
              }

              // 处理题干
              const questionStemSegments = item.question.queStem ? parseMathText(item.question.queStem, imageUrlMap) : [];

              // 处理选项 (仅选择题)
              const questionOptions = typeValue === 1 ? (
                [
                  { label: 'A', segments: item.question.optionA ? parseMathText(item.question.optionA, imageUrlMap) : [], value: 'A' },
                  { label: 'B', segments: item.question.optionB ? parseMathText(item.question.optionB, imageUrlMap) : [], value: 'B' },
                  { label: 'C', segments: item.question.optionC ? parseMathText(item.question.optionC, imageUrlMap) : [], value: 'C' },
                  { label: 'D', segments: item.question.optionD ? parseMathText(item.question.optionD, imageUrlMap) : [], value: 'D' },
                ].filter(opt => opt.segments && opt.segments.length > 0)
              ) : undefined;

              // 处理正确答案 (填空题和解答题可能包含数学公式或图片)
              let correctAnswerSegments = null;
              if (typeValue === 2 && item.question.answer) { // For Fill-in-the-blank
                  correctAnswerSegments = parseMathText(item.question.answer, imageUrlMap);
              } else if (typeValue === 3 && item.question.solution) { // For Application questions
                  correctAnswerSegments = parseMathText(item.question.solution, imageUrlMap);
              }

              // 处理解析
              const rawAnalysis = item.detailRecord && item.detailRecord.analysis ? item.detailRecord.analysis : (item.question.analysis || '');
              const analysisSegments = parseMathText(rawAnalysis, imageUrlMap);

              // 处理解答 (solution only for application questions from the question object)
              const rawSolution = item.question.solution || ''; // This is the solution from the question object, used for parsing solutionSegments
              const solutionSegments = parseMathText(rawSolution, imageUrlMap);

              const processedQuestion = {
                id: item.question.qaId || item.question.qbId || 'unknown-' + item.question.queSort,
                number: item.question.queSort,
                type: typeName,
                originalType: typeValue,
                textSegments: questionStemSegments,
                options: questionOptions,
                stuAnswer: item.detailRecord ? item.detailRecord.stuAnswer : null,
                correctAnswer: item.question.correctAnswer || null, // Keep raw answer for choice type
                correctAnswerSegments: correctAnswerSegments, // Parsed correct answer for fill/application
                analysis: rawAnalysis, // Keep raw analysis for display if needed, but primarily use segments
                analysisSegments: analysisSegments,
                solution: rawSolution, // Keep raw solution for display if needed, but primarily use segments
                solutionSegments: solutionSegments,
                status: status,
                studentScore: studentQuestionScore,
                questionScore: item.question.score || 0,
                imageData: item.detailRecord && item.detailRecord.imageData && item.detailRecord.imageData.length > 0 ? item.detailRecord.imageData : [],
                imageUrls: item.detailRecord ? item.detailRecord.imageUrls : null,
                detailRecordId: item.detailRecord ? item.detailRecord.detId : null,
                teacherComment: item.detailRecord ? item.detailRecord.teacherComment : null,
              };

              // 如果有图片URL，将其添加到 uploadedImages 中
              if (item.detailRecord && item.detailRecord.imageUrls) {
                const questionId = processedQuestion.id;
                if (!uploadedImages.value[questionId]) {
                  uploadedImages.value[questionId] = [];
                }
                
                // 将图片URL转换为图片数据对象
                const imageUrls = Array.isArray(item.detailRecord.imageUrls) 
                  ? item.detailRecord.imageUrls 
                  : item.detailRecord.imageUrls.split(',').map(url => url.trim()); // 处理逗号分隔的URL
                
                imageUrls.forEach(url => {
                  if (url) {
                    uploadedImages.value[questionId].push({
                      url: url,
                      uploadTime: new Date().toISOString(),
                      // 如果有 base64 数据，也保存下来
                      base64: item.detailRecord.imageDataBase64 || null
                    });
                  }
                });

                // 将处理后的图片URL数组赋值给当前问题的 imageUrls 属性
                processedQuestion.imageUrls = imageUrls;
              }

              // Log the processed question data for debugging
              console.log(`Processed Question ${processedQuestion.number}:`, processedQuestion);
              // console.log(`Analysis for Question ${processedQuestion.number}:`, processedQuestion.analysis);
              // console.log(`Analysis Segments for Question ${processedQuestion.number}:`, processedQuestion.analysisSegments);

              allQuestions.push(processedQuestion);
            });
          }
        };

        processQuestions(res.result.choiceAnswers, '选择题', 1);
        processQuestions(res.result.blankAnswers, '填空题', 2);
        processQuestions(res.result.applicationAnswers, '解答题', 3);

        // Sort all questions by queSort
        allQuestions.sort((a, b) => a.number - b.number);

        // Debugging: Log scores before assigning to questions.value
        // allQuestions.forEach(q => {
        //     console.log(`Debug - Question ${q.number}: questionScore = ${q.questionScore}, studentScore = ${q.studentScore}`);
        // });

        // Group sorted questions by type for the result summary display
        const resultQuestionSummaryGrouped = {};
        allQuestions.forEach(q => {
          if (!resultQuestionSummaryGrouped[q.type]) {
            resultQuestionSummaryGrouped[q.type] = { 
              name: q.type,
              count: 0,
              questions: []
            };
          }
          resultQuestionSummaryGrouped[q.type].count++;
          resultQuestionSummaryGrouped[q.type].questions.push({
            number: q.number,
            originalIndex: allQuestions.indexOf(q), // Store original index for potential analysis navigation
            status: q.status // Use the determined status
          });
        });

         // Convert grouped object to ordered array
        const orderedResultTypes = [];
        if (resultQuestionSummaryGrouped['选择题']) orderedResultTypes.push(resultQuestionSummaryGrouped['选择题']);
        if (resultQuestionSummaryGrouped['填空题']) orderedResultTypes.push(resultQuestionSummaryGrouped['填空题']);
        if (resultQuestionSummaryGrouped['解答题']) orderedResultTypes.push(resultQuestionSummaryGrouped['解答题']);
        // Add any other types if they exist
        for (const typeKey in resultQuestionSummaryGrouped) {
            if (!['选择题', '填空题', '解答题'].includes(typeKey)) {
                orderedResultTypes.push(resultQuestionSummaryGrouped[typeKey]);
            }
        }

        // Update store state with fetched data
        // Assuming paperTitle comes from elsewhere or needs to be added to the API response if not there
        // For now, using a placeholder or trying to derive from questions if possible
        paperTitle.value = res.result.paperQues ? res.result.paperQues.paperName : '考试试卷'; // Assuming paper name is available here
        score.value = totalScoreAchieved; // Use calculated score
        totalScore.value = totalPaperScore; // Use calculated total paper score
        timeSpent.value = res.result.examRecord && res.result.examRecord.timeSpent !== null ? Math.floor(res.result.examRecord.timeSpent / 60000) : 0; // Use timeSpent from record if available, in minutes
        resultQuestionSummary.value = orderedResultTypes; // Update the new state variable

        // Store all questions for potential analysis view later
        questions.value = allQuestions; // Reuse the existing questions state to store full question data

      } else {
        console.error('Failed to load exam details:', res.msg);
        // Optionally load mock data or show an error
         loadMockDataForResult();
      }

    } catch (error) {
      console.error('Error fetching exam details:', error);
      // Optionally load mock data or show an error
       loadMockDataForResult();
    }
  };

  // Mock data for result page (different from answering page mock)
  const loadMockDataForResult = () => {
      paperTitle.value = '模拟试卷（无数据）';
      score.value = 10;
      totalScore.value = 150;
      timeSpent.value = 0;
      resultQuestionSummary.value = [
          { name: '选择题', count: 9, questions: [
              { number: 1, originalIndex: 0, status: 'correct' },
              { number: 2, originalIndex: 1, status: 'incorrect' },
              { number: 3, originalIndex: 2, status: 'unanswered' },
              { number: 4, originalIndex: 3, status: 'correct' },
              { number: 5, originalIndex: 4, status: 'incorrect' },
              { number: 6, originalIndex: 5, status: 'correct' },
              { number: 7, originalIndex: 6, status: 'unanswered' },
              { number: 8, originalIndex: 7, status: 'incorrect' },
              { number: 9, originalIndex: 8, status: 'correct' },
          ]},
           { name: '填空题', count: 6, questions: [
              { number: 10, originalIndex: 9, status: 'answered' },
              { number: 11, originalIndex: 10, status: 'unanswered' },
              { number: 12, originalIndex: 11, status: 'answered' },
              { number: 13, originalIndex: 12, status: 'unanswered' },
              { number: 14, originalIndex: 13, status: 'answered' },
              { number: 15, originalIndex: 14, status: 'unanswered' },
          ]},
           { name: '解答题', count: 5, questions: [
              { number: 16, originalIndex: 15, status: 'answered' },
              { number: 17, originalIndex: 16, status: 'unanswered' },
              { number: 18, originalIndex: 17, status: 'answered' },
              { number: 19, originalIndex: 18, status: 'unanswered' },
              { number: 20, originalIndex: 19, status: 'answered' },
          ]},
      ];

       // Populate questions state with mock data structure for potential analysis
        questions.value = resultQuestionSummary.value.flatMap(type => type.questions.map(q => ({
            id: 'mock-id-' + q.number,
            number: q.number,
            type: type.name,
            originalType: type.name === '选择题' ? 1 : (type.name === '填空题' ? 2 : 3),
            textSegments: [{ type: 'text', content: 'Mock Question ' + q.number }],
            options: type.originalType === 1 ? [] : undefined,
            stuAnswer: q.status === 'unanswered' ? null : 'mock answer',
            correctAnswer: q.status === 'correct' ? 'mock answer' : 'other answer',
            analysis: 'Mock analysis for question ' + q.number,
            solution: 'Mock solution for question ' + q.number,
            status: q.status,
            studentScore: q.status === 'correct' ? 5 : 0,
            questionScore: 5,
            imageData: [],
            imageUrls: null,
            detailRecordId: 'mock-detail-id-' + q.number
        })));

  };

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
    resultQuestionSummary,
    score,
    totalScore,
    timeSpent,
    currentPushId,
    
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
    resetUploadedImages,
    toggleFavorite,
    loadExamDetails,
    loadMockDataForResult
  }
}) 