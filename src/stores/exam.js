import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getQuestionList } from '@/api/exam'
import { submitExamComplete } from '@/api/exam'
import { useUserStore } from '@/stores/user'
import { getExamDetails } from '@/api/exam'
import { getImageFromMinio } from '@/api/exam'

// 解析数学公式文本的辅助函数
export const parseMathText = async (text, imageUrlMap = {}) => {
  if (!text || typeof text !== 'string') {
    return [];
  }
  
  const segments = [];
  let currentIndex = 0;
  
  // Regex to find either $$...$$, $...$, or [IMAGE_ID:...] globally
  const combinedRegex = /(\$\$[\s\S]*?\$\$)|(\$[\s\S]*?\$)|(\[IMAGE_ID:([a-f0-9-]+)\])/g;
  
  let match;
  const imageMatches = [];
  
  // 首先收集所有匹配项
  while ((match = combinedRegex.exec(text)) !== null) {
    const fullMatch = match[0];
    const matchIndex = match.index;

    // 添加文本段落
    if (matchIndex > currentIndex) {
      const textContent = text.substring(currentIndex, matchIndex);
      if (textContent.trim()) {
        segments.push({ type: 'text', content: textContent });
      }
    }
    
    // 处理匹配项
    if (match[1]) {
      // Display math $$...$$
      segments.push({ type: 'formula', content: match[1].substring(2, match[1].length - 2).trim(), displayMode: true });
    } else if (match[2]) {
      // Inline math $...$
      segments.push({ type: 'formula', content: match[2].substring(1, match[2].length - 1).trim(), displayMode: false });
    } else if (match[3]) {
      // Image ID [IMAGE_ID:...]
      const imageId = match[4];
      const imagePath = imageUrlMap[imageId];
      if (imagePath) {
        imageMatches.push({
          index: segments.length,
          imageId,
          imagePath
        });
        // 先添加一个占位符
        segments.push({ type: 'image', url: null });
      } else {
        segments.push({ type: 'text', content: fullMatch });
      }
    }
    
    currentIndex = matchIndex + fullMatch.length;
  }
  
  // 添加剩余文本
  if (currentIndex < text.length) {
    const textContent = text.substring(currentIndex);
    if (textContent.trim()) {
      segments.push({ type: 'text', content: textContent });
    }
  }
  
  // 如果没有找到任何模式且原始文本有内容，将其作为单个文本段落返回
  if (segments.length === 0 && text.trim()) {
    segments.push({ type: 'text', content: text });
  }

  // 一张一张处理图片
  if (imageMatches.length > 0) {
    for (let i = 0; i < imageMatches.length; i++) {
      const { index, imagePath } = imageMatches[i];
      // 在发起下一个图片请求前等待1000ms，第一个图片除外
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      try {
        const response = await getImageFromMinio(imagePath);
        if (response.flag === '1' && response.result?.imageData) {
          const base64Url = `data:${response.result.contentType};base64,${response.result.imageData}`;
          segments[index].url = base64Url;
        } else {
          segments[index] = { type: 'text', content: '[图片加载失败]' };
        }
      } catch (error) {
        console.error('获取图片失败:', error);
        segments[index] = { type: 'text', content: '[图片加载失败]' };
      }
    }
  }
  
  return segments;
};

// 批量处理文本中的图片
export const processMathTexts = async (texts, imageUrlMap) => {
  if (!Array.isArray(texts)) {
    return await parseMathText(texts, imageUrlMap);
  }
  
  return await Promise.all(texts.map(text => parseMathText(text, imageUrlMap)));
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

// 处理图片URL，从minio获取图片数据
const processImageUrl = async (imageUrl) => {
  if (!imageUrl) return null;
  try {
    const response = await getImageFromMinio(imageUrl);
    if (response.flag === '1' && response.result?.imageData) {
      return `data:${response.result.contentType};base64,${response.result.imageData}`;
    }
    console.warn('Failed to get image data for URL:', imageUrl);
    return null;
  } catch (error) {
    console.error('Error processing image URL:', imageUrl, error);
    return null;
  }
};

// 处理多个图片URL
const processImageUrls = async (imageUrls) => {
  if (!imageUrls) return [];
  // 如果imageUrls是字符串，可能是逗号分隔的多个URL
  const urls = typeof imageUrls === 'string' ? imageUrls.split(',').map(url => url.trim()) : imageUrls;
  
  const processedImages = [];
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    if (i > 0) {
      await new Promise(resolve => setTimeout(resolve, 100)); // 在每次请求前等待1秒
    }
    const processed = await processImageUrl(url);
    processedImages.push(processed);
  }
  
  // 过滤掉处理失败的图片
  return processedImages.filter(img => img !== null);
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
      paperId.value = null;
      uploadedImages.value = {};
      currentPushId.value = null;
      return
    }
    paperId.value = sourceId;
    currentPushId.value = pushId;
    try {
      console.log('Calling getQuestionList API...');
      const res = await getQuestionList(sourceId)
      console.log('getQuestionList API response:', res);
      if (res.flag === '1' && res.result) {
        console.log('API call successful, res.result:', res.result);
        const imageUrlMap = res.result.imageUrlMap || {};
        const processQuestions = async (list, type) => {
          if (!list) return [];
          const processedList = [];
          for (const item of list) {
            // 题干
            let textSegments = item.queStem ? await parseMathText(item.queStem, imageUrlMap) : [];
            // Ensure textSegments is an array
            if (!Array.isArray(textSegments)) {
              textSegments = [];
            }
            // 多选题前缀
            if (item.choiceType === 2 && type === 'choice') {
              textSegments = [
                { type: 'multipleChoicePrefix', content: '(多选题)' },
                ...textSegments
              ];
            }
            // 选项（仅选择题）
            let options = undefined;
            if (type === 'choice') {
              const processedOptions = [];
              if (item.optionA) processedOptions.push({ label: 'A', segments: await parseMathText(item.optionA, imageUrlMap), value: 'A' });
              if (item.optionB) processedOptions.push({ label: 'B', segments: await parseMathText(item.optionB, imageUrlMap), value: 'B' });
              if (item.optionC) processedOptions.push({ label: 'C', segments: await parseMathText(item.optionC, imageUrlMap), value: 'C' });
              if (item.optionD) processedOptions.push({ label: 'D', segments: await parseMathText(item.optionD, imageUrlMap), value: 'D' });
              options = processedOptions.filter(opt => opt.segments.length > 0);
            }
            processedList.push({
              id: item.qcId || item.qbId || item.qaId,
              number: item.queSort,
              type,
              choiceType: item.choiceType,
              textSegments,
              options,
              selectedAnswers: type === 'choice' ? [] : undefined,
              selectedAnswer: type !== 'choice' ? '' : undefined,
              score: item.score,
            });
          }
          return processedList;
        };
        // 顺序处理所有题型
        const choice = await processQuestions(res.result.choiceQuestions, 'choice');
        const fill = await processQuestions(res.result.blankQuestions, 'fill');
        const application = await processQuestions(res.result.applicationQuestions, 'application');
        
        // 合并排序
        const all = [...choice, ...fill, ...application].sort((a, b) => a.number - b.number).map((q, index) => ({ ...q, index }));
        questions.value = all;
        paperTitle.value = res.result.paperName || '试卷名称';
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

      // 自定义图片压缩函数
      const compressImage = async (imagePath, quality = 0.8) => {
        try {
          // 获取图片信息
          const imgInfo = await uni.getImageInfo({
            src: imagePath
          });
          
          // 计算压缩后的尺寸，保持宽高比
          let targetWidth = imgInfo.width;
          let targetHeight = imgInfo.height;
          
          // 如果图片太大，按比例缩小
          const MAX_WIDTH = 1024; // 最大宽度
          const MAX_HEIGHT = 1024; // 最大高度
          
          if (targetWidth > MAX_WIDTH || targetHeight > MAX_HEIGHT) {
            const ratio = Math.min(MAX_WIDTH / targetWidth, MAX_HEIGHT / targetHeight);
            targetWidth = Math.floor(targetWidth * ratio);
            targetHeight = Math.floor(targetHeight * ratio);
          }
          
          // 创建canvas上下文
          return new Promise((resolve, reject) => {
            // #ifdef H5
            // H5平台使用FileReader和canvas压缩
            const canvas = document.createElement('canvas');
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            const ctx = canvas.getContext('2d');
            
            const img = new Image();
            img.onload = function() {
              ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
              // 转为base64，quality为压缩质量
              const base64 = canvas.toDataURL('image/jpeg', quality);
              resolve(base64);
            };
            img.onerror = function(e) {
              console.error('Canvas压缩图片失败:', e);
              reject(e);
            };
            img.src = imagePath;
            // #endif
            
            // #ifndef H5
            // 非H5平台，尝试使用uni.createCanvasContext
            try {
              const canvasId = 'compressCanvas' + Date.now();
              const ctx = uni.createCanvasContext(canvasId);
              
              ctx.drawImage(imagePath, 0, 0, targetWidth, targetHeight);
              ctx.draw(false, () => {
                // 延迟执行，确保canvas已经绘制完成
                setTimeout(() => {
                  uni.canvasToTempFilePath({
                    canvasId: canvasId,
                    quality: quality,
                    success: (res) => {
                      resolve(res.tempFilePath);
                    },
                    fail: (err) => {
                      console.error('Canvas导出图片失败:', err);
                      reject(err);
                    }
                  });
                }, 300);
              });
            } catch (err) {
              console.error('Canvas压缩图片失败:', err);
              reject(err);
            }
            // #endif
          });
        } catch (error) {
          console.error('压缩图片过程出错:', error);
          return imagePath; // 出错时返回原图
        }
      };

      // 压缩图片
      let compressedPath = tempFilePath;
      let isCompressed = false;
      try {
        // 只有当图片宽度或高度大于1024时才进行压缩
        if (imageInfo.width > 1024 || imageInfo.height > 1024) {
          const result = await compressImage(tempFilePath, 0.5);
          if (result && result !== tempFilePath) {
            compressedPath = result;
            isCompressed = true;
            console.log('图片压缩成功');
          }
        } else {
          console.log('图片尺寸较小，无需压缩');
        }
      } catch (compressError) {
        console.warn('图片压缩过程出错，将使用原图:', compressError);
        // 压缩失败继续使用原图
      }

      // 将图片转换为 base64
      const base64 = await new Promise((resolve, reject) => {
        // #ifdef H5
        // 如果已经是base64格式（H5压缩后的结果），直接提取数据部分
        if (isCompressed && compressedPath.startsWith('data:')) {
          const base64Data = compressedPath.split(',')[1];
          resolve(base64Data);
          return;
        }
        
        const xhr = new XMLHttpRequest();
        xhr.open('GET', compressedPath, true);
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
          filePath: compressedPath,
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
        url: compressedPath, // 使用压缩后的图片路径
        tempFilePath: tempFilePath, // 保留原始路径
        uploadTime: new Date().toISOString(),
        imageInfo: imageInfo, // 保存图片信息
        base64: base64, // 保存 base64 编码
        compressed: isCompressed // 标记是否经过压缩
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
          imageInfo: imageInfo,
          compressed: isCompressed
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

  // 新版：解析页异步处理所有图片
  const loadExamDetails = async (recordId) => {
    console.log('loadExamDetails called with recordId:', recordId);
    if (!recordId) {
      console.warn('No recordId provided for loading exam details.');
      loadMockDataForResult();
      return;
    }
    try {
      const res = await getExamDetails(recordId);
      console.log('getExamDetails API response:', res);
      if (res.flag === '1' && res.result) {
        const imageUrlMap = res.result.imageUrlMap || {};
        const allQuestions = [];
        let totalScoreAchieved = 0;
        let totalPaperScore = 0;
        // 处理所有题型
        const processQuestions = async (questions, typeName, typeValue) => {
          if (!questions) return [];
          return await Promise.all(questions.map(async (item) => {
            // 题干
            const textSegments = item.question.queStem ? await parseMathText(item.question.queStem, imageUrlMap) : [];
            // 选项（仅选择题）
            let options = undefined;
            if (typeValue === 1) {
              options = [
                { label: 'A', segments: item.question.optionA ? await parseMathText(item.question.optionA, imageUrlMap) : [], value: 'A' },
                { label: 'B', segments: item.question.optionB ? await parseMathText(item.question.optionB, imageUrlMap) : [], value: 'B' },
                { label: 'C', segments: item.question.optionC ? await parseMathText(item.question.optionC, imageUrlMap) : [], value: 'C' },
                { label: 'D', segments: item.question.optionD ? await parseMathText(item.question.optionD, imageUrlMap) : [], value: 'D' },
              ].filter(opt => opt.segments.length > 0);
            }
            // 正确答案（填空/解答题）
            let correctAnswerSegments = null;
            if (typeValue === 2 && item.question.answer) {
              correctAnswerSegments = await parseMathText(item.question.answer, imageUrlMap);
            } else if (typeValue === 3 && item.question.solution) {
              correctAnswerSegments = await parseMathText(item.question.solution, imageUrlMap);
            }
            // 解析
            const rawAnalysis = item.detailRecord && item.detailRecord.analysis ? item.detailRecord.analysis : (item.question.analysis || '');
            const analysisSegments = await parseMathText(rawAnalysis, imageUrlMap);
            // 解答（solution，仅解答题）
            const rawSolution = item.question.solution || '';
            const solutionSegments = await parseMathText(rawSolution, imageUrlMap);
            // 题目状态
            let status = 'unanswered';
            let studentQuestionScore = 0;
            totalPaperScore += item.question.score || 0;
            if (typeValue === 1) {
              if (item.detailRecord) {
                if (item.detailRecord.value !== null) totalScoreAchieved += item.detailRecord.value;
                if (item.detailRecord.stuAnswer !== null) {
                  if (item.detailRecord.stuAnswer === item.question.correctAnswer) status = 'correct';
                  else status = 'incorrect';
                } else status = 'unanswered';
              }
            }
            // 处理学生上传的图片
            let processedImageUrls = [];
            if (item.detailRecord && item.detailRecord.imageUrls) {
              processedImageUrls = await processImageUrls(item.detailRecord.imageUrls);
            }
            // 组装题目对象
            return {
              id: item.question.qaId || item.question.qbId || 'unknown-' + item.question.queSort,
              number: item.question.queSort,
              type: typeName,
              originalType: typeValue,
              textSegments,
              options,
              stuAnswer: item.detailRecord ? item.detailRecord.stuAnswer : null,
              correctAnswer: item.question.correctAnswer || null,
              correctAnswerSegments,
              analysis: rawAnalysis,
              analysisSegments,
              solution: rawSolution,
              solutionSegments,
              status,
              studentScore: item.detailRecord && item.detailRecord.value !== null ? item.detailRecord.value : 0,
              questionScore: item.question.score || 0,
              imageData: item.detailRecord && item.detailRecord.imageData && item.detailRecord.imageData.length > 0 ? item.detailRecord.imageData : [],
              imageUrls: processedImageUrls, // 使用处理后的图片URL
              detailRecordId: item.detailRecord ? item.detailRecord.detId : null,
              teacherComment: item.detailRecord ? item.detailRecord.teacherComment : null,
            };
          }));
        };
        // 顺序处理所有题型
        const choice = await processQuestions(res.result.choiceAnswers, '选择题', 1);
        const blank = await processQuestions(res.result.blankAnswers, '填空题', 2);
        const application = await processQuestions(res.result.applicationAnswers, '解答题', 3);
        
        // 合并排序
        const all = [...choice, ...blank, ...application].sort((a, b) => a.number - b.number);
        questions.value = all;
        // 组装答题卡
        const resultQuestionSummaryGrouped = {};
        all.forEach(q => {
          if (!resultQuestionSummaryGrouped[q.type]) {
            resultQuestionSummaryGrouped[q.type] = { name: q.type, count: 0, questions: [] };
          }
          resultQuestionSummaryGrouped[q.type].count++;
          resultQuestionSummaryGrouped[q.type].questions.push({
            number: q.number,
            originalIndex: all.indexOf(q),
            status: q.status
          });
        });
        const orderedResultTypes = [];
        if (resultQuestionSummaryGrouped['选择题']) orderedResultTypes.push(resultQuestionSummaryGrouped['选择题']);
        if (resultQuestionSummaryGrouped['填空题']) orderedResultTypes.push(resultQuestionSummaryGrouped['填空题']);
        if (resultQuestionSummaryGrouped['解答题']) orderedResultTypes.push(resultQuestionSummaryGrouped['解答题']);
        for (const typeKey in resultQuestionSummaryGrouped) {
          if (!['选择题', '填空题', '解答题'].includes(typeKey)) {
            orderedResultTypes.push(resultQuestionSummaryGrouped[typeKey]);
          }
        }
        paperTitle.value = res.result.paperQues ? res.result.paperQues.paperName : '考试试卷';
        score.value = totalScoreAchieved;
        totalScore.value = totalPaperScore;
        timeSpent.value = res.result.examRecord && res.result.examRecord.timeSpent !== null ? Math.floor(res.result.examRecord.timeSpent / 60000) : 0;
        resultQuestionSummary.value = orderedResultTypes;
      } else {
        console.error('Failed to load exam details:', res.msg);
        loadMockDataForResult();
      }
    } catch (error) {
      console.error('Error fetching exam details:', error);
      loadMockDataForResult();
    }
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
    loadExamDetails
  }
}) 