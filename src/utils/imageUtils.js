import { getImageFromMinio } from '@/api/exam';

// 处理单个图片URL
const processSingleImage = async (imagePath) => {
  try {
    // 去掉前面的域名和端口，只保留相对路径
    //if (imagePath && imagePath.startsWith('http')) {
    //  try {
    //    const url = new URL(imagePath);
    //    imagePath = url.pathname + url.search; // 只保留路径和查询参数
    //  } catch (e) {
        // 如果不是合法URL，保持原样
    //  }
    //}
    const response = await getImageFromMinio(imagePath);
    if (response.flag === '1' && response.result?.imageData) {
      return `data:${response.result.contentType};base64,${response.result.imageData}`;
    }
    return null;
  } catch (error) {
    console.error('获取图片失败:', error);
    return null;
  }
};

// 处理图片URL，将IMAGE_ID替换为实际的base64图片数据
export const processImageUrl = async (content, imageUrlMap, onImageProcessed) => {
  if (!content || !imageUrlMap) return content;

  // 使用正则表达式匹配IMAGE_ID
  const imageRegex = /IMAGE_ID:(\d+)/g;
  let match;
  const imagePaths = [];
  const imageIdToPath = new Map();

  // 收集所有需要处理的图片路径
  while ((match = imageRegex.exec(content)) !== null) {
    const imageId = match[1];
    const imagePath = imageUrlMap[imageId];
    if (imagePath) {
      imagePaths.push(imagePath);
      imageIdToPath.set(imageId, imagePath);
    }
  }

  // 一张一张处理图片
  let processedContent = content;
  let i = 0;
  for (const [imageId, path] of imageIdToPath) {
    if (i > 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    const base64Url = await processSingleImage(path);
    if (base64Url) {
      processedContent = processedContent.replace(
        `IMAGE_ID:${imageId}`,
        base64Url
      );
      // 每处理完一张图片就通知回调
      if (onImageProcessed) {
        onImageProcessed(processedContent);
      }
    }
    i++;
  }

  return processedContent;
};

// 批量处理图片URL
export const processImageUrls = async (contentList, imageUrlMap, onImageProcessed) => {
  if (!Array.isArray(contentList)) return contentList;

  const processedList = [];
  for (const content of contentList) {
    const processed = await processImageUrl(content, imageUrlMap, onImageProcessed);
    processedList.push(processed);
  }

  return processedList;
}; 