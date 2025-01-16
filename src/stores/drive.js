import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useUserStore } from './user'
import { useBotStore } from './bot'
import { useChatStore } from './chat'

export const useDriveStore = defineStore('drive', () => {
  const userStore = useUserStore()
  const botStore = useBotStore()
  const chatStore = useChatStore()
  const BACKUP_FILE_NAME = 'botfusion_backup.json'

  // 获取备份文件ID
  async function getBackupFileId() {
    try {
      const params = new URLSearchParams({
        q: `name='${BACKUP_FILE_NAME}' and trashed=false`,
        fields: 'files(id)',
      })

      const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
        headers: {
          'Authorization': `Bearer ${userStore.user.accessToken}`,
        },
      })

      if (!response.ok) {
        throw new Error(`获取文件失败: ${response.status}`);
      }

      const data = await response.json();
      return data.files[0]?.id;
    } catch (error) {
      console.error('获取备份文件ID失败:', error);
      throw error;
    }
  }

  // 保存所有数据到Drive
  async function saveAllData() {
    try {
      if (!userStore.user.accessToken) {
        throw new Error('未登录 Google 账号')
      }

      // 将数据转换为JSON字符串
      const fileContent = JSON.stringify({
        conversations: chatStore.conversations,
        messages: chatStore.messages,
        botConfigs: botStore.botConfigs,
        activeBots: botStore.activeBots,
        updatedAt: new Date().toISOString()
      })

      const existingFileId = await getBackupFileId()

      if (existingFileId) {
        // 更新现有文件
        // 定义文件的元数据，包括文件名和MIME类型
        const metadata = {
          name: BACKUP_FILE_NAME,
          mimeType: 'application/json',
        }

        // 自定义分隔符，用于分隔请求体中的不同部分
        // 使用固定的boundary而不是让浏览器自动生成，这样我们可以完全控制请求体的格式
        const boundary = '-------314159265358979323846';
        // 分隔符需要在每个部分之前添加
        const delimiter = "\r\n--" + boundary + "\r\n";
        // 结束分隔符需要在整个请求体的最后添加
        const close_delim = "\r\n--" + boundary + "--";

        // 手动构建multipart请求体
        // 1. 第一部分：元数据
        // 2. 第二部分：文件内容
        // 这样的格式可以让我们精确控制每个部分的内容，避免浏览器自动添加额外的头部
        const multipartRequestBody =
          delimiter +
          'Content-Type: application/json\r\n\r\n' +
          JSON.stringify(metadata) +
          delimiter +
          'Content-Type: application/json\r\n\r\n' +
          fileContent +
          close_delim;

        // 发送更新请求
        // uploadType=multipart 表明这是一个多部分请求
        // Content-Type 使用 multipart/related 而不是 multipart/form-data
        // 这样可以避免浏览器自动添加 form-data 相关的头部
        const updateResponse = await fetch(
          `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=multipart`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${userStore.user.accessToken}`,
            'Content-Type': `multipart/related; boundary=${boundary}`,
          },
          body: multipartRequestBody
        })

        if (!updateResponse.ok) {
          throw new Error(`更新文件失败: ${updateResponse.status}`)
        }

        return await updateResponse.json()
      } else {
        // 创建新文件的逻辑与更新文件类似
        const metadata = {
          name: BACKUP_FILE_NAME,
          mimeType: 'application/json',
        }

        const boundary = '-------314159265358979323846';
        const delimiter = "\r\n--" + boundary + "\r\n";
        const close_delim = "\r\n--" + boundary + "--";

        // 手动构建multipart请求体，格式与更新文件相同
        const multipartRequestBody =
          delimiter +
          'Content-Type: application/json\r\n\r\n' +
          JSON.stringify(metadata) +
          delimiter +
          'Content-Type: application/json\r\n\r\n' +
          fileContent +
          close_delim;

        // 创建新文件的请求
        // 使用 POST 方法而不是 PATCH
        const createResponse = await fetch(
          'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${userStore.user.accessToken}`,
            'Content-Type': `multipart/related; boundary=${boundary}`,
          },
          body: multipartRequestBody
        })

        if (!createResponse.ok) {
          throw new Error(`创建文件失败: ${createResponse.status}`)
        }

        return await createResponse.json()
      }
    } catch (error) {
      console.error('保存数据失败:', error)
      throw error
    }
  }

  // 从Drive读取所有数据
  async function loadAllData() {
    try {
      if (!userStore.user.accessToken) {
        throw new Error('未登录 Google 账号')
      }

      const fileId = await getBackupFileId()
      if (!fileId) {
        throw new Error('未找到备份文件')
      }

      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        headers: {
          'Authorization': `Bearer ${userStore.user.accessToken}`,
        },
      })

      if (!response.ok) {
        throw new Error(`读取文件失败: ${response.status}`)
      }

      const data = await response.json();

      // 验证数据完整性
      if (!data.conversations || !data.messages || !data.botConfigs) {
        throw new Error('备份文件数据不完整')
      }

      return data
    } catch (error) {
      console.error('读取数据失败:', error)
      throw error
    }
  }

  return {
    saveAllData,
    loadAllData
  }
})
