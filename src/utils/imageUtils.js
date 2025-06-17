import { getImageFromMinio } from '@/api/exam';

// 处理图片URL，将IMAGE_ID替换为实际的base64图片数据
export const processImageUrl = async (content, imageUrlMap) => {
  if (!content || !imageUrlMap) return content;

  // 使用正则表达式匹配IMAGE_ID
  const imageRegex = /IMAGE_ID:(\d+)/g;
  let match;
  let processedContent = content;

  while ((match = imageRegex.exec(content)) !== null) {
    const imageId = match[1];
    const imagePath = imageUrlMap[imageId];

    if (imagePath) {
      try {
        // 从minio获取图片数据
        const response = await getImageFromMinio(imagePath);
        if (response.flag === '1' && response.result?.imageData) {
          // 构造base64图片URL
          const base64ImageUrl = `data:${response.result.contentType};base64,${response.result.imageData}`;
          // 替换IMAGE_ID为base64图片URL
          processedContent = processedContent.replace(
            `IMAGE_ID:${imageId}`,
            base64ImageUrl
          );
        }
      } catch (error) {
        console.error('获取图片失败:', error);
      }
    }
  }

  return processedContent;
};

// 批量处理图片URL
export const processImageUrls = async (contentList, imageUrlMap) => {
  if (!Array.isArray(contentList)) return contentList;

  const processedList = await Promise.all(
    contentList.map(content => processImageUrl(content, imageUrlMap))
  );

  return processedList;
}; 