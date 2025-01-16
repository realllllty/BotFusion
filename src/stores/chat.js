import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import { useBotStore } from './bot'

/**
 * 聊天管理 Store
 * 功能：
 * 1. 管理对话列表
 * 2. 处理消息的发送和接收
 * 3. 维护当前对话的状态
 * 4. 持久化存储对话记录
 */
export const useChatStore = defineStore('chat', () => {
  const botStore = useBotStore()

  // 默认对话配置
  const DEFAULT_CONVERSATION = {
    id: 'default',
    title: '新对话',
    createdAt: Date.now()
  }

  // 对话列表
  const conversations = ref([DEFAULT_CONVERSATION])

  // 当前选中的对话ID
  const currentConversationId = ref('default')

  // 所有对话的消息记录
  /**
   * messages: {
   *   [conversationId: string]: Array<{
   *     id: string, // 消息ID
   *     role: 'user' | 'assistant', // 消息发送者角色
   *     content: string, // 消息内容
   *     timestamp: number, // 消息时间戳
   *     botId?: string, // 机器人ID（仅当角色为assistant时存在）
   *     isStreaming?: boolean, // 是否为流式消息
   *     isError?: boolean // 是否为错误消息
   *   }>
   * }
   */
  const messages = ref({
    default: []
  })

  // 获取当前对话的所有消息
  const currentMessages = computed(() => {
    return messages.value[currentConversationId.value] || []
  })

  // 获取指定机器人在当前对话中的消息
  const currentBotMessages = computed(() => (botId) => {
    return currentMessages.value.filter(
      (msg) => msg.botId === botId || msg.role === 'user'
    )
  })

  // 使用默认机器人生成对话标题
  async function generateTitle(content) {
    const defaultBot = botStore.getBotConfig('default')
    if (!defaultBot?.apiKey) {
      return content.slice(0, 20) + (content.length > 20 ? '...' : '')
    }

    try {
      const response = await fetch(
        `${defaultBot.baseUrl}/chat/completions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${defaultBot.apiKey}`
          },
          body: JSON.stringify({
            model: defaultBot.model,
            messages: [
              {
                role: 'system',
                content:
                  '你是一个对话总结助手。请用简短的一句话总结用户的输入内容，不要超过15个字。不要带有标点符号。'
              },
              {
                role: 'user',
                content
              }
            ],
            temperature: 0.7,
            max_tokens: 60,
            stream: false
          })
        }
      )

      if (!response.ok) {
        throw new Error('标题生成失败')
      }

      const result = await response.json()
      return result.choices[0].message.content.trim()
    } catch (error) {
      console.error('生成标题失败:', error)
      return content.slice(0, 20) + (content.length > 20 ? '...' : '')
    }
  }

  // 创建新对话
  function createNewConversation() {
    const newConversation = {
      id: uuidv4(),
      title: '新对话',
      createdAt: Date.now()
    }
    conversations.value.unshift(newConversation)
    messages.value[newConversation.id] = []
    currentConversationId.value = newConversation.id
    return newConversation.id
  }

  // 切换当前对话
  function setCurrentConversation(conversationId) {
    if (conversations.value.find((conv) => conv.id === conversationId)) {
      currentConversationId.value = conversationId
    }
  }

  // 删除对话
  function deleteConversation(conversationId) {
    // 不允许删除最后一个对话
    if (conversations.value.length === 1) return

    conversations.value = conversations.value.filter(
      (conv) => conv.id !== conversationId
    )
    delete messages.value[conversationId]

    // 如果删除的是当前对话，切换到最新的对话
    if (currentConversationId.value === conversationId) {
      currentConversationId.value =
        conversations.value[conversations.value.length - 1].id
    }
  }

  // 处理流式响应
  async function handleStreamResponse(
    response, // fetch API 的响应对象
    botMessage, // 机器人消息对象
    conversationId, // 当前对话ID
    messageIndex // 消息在数组中的索引
  ) {
    /**
     * 创建响应流读取器和解码器
     * ReadableStreamDefaultReader.read()读取网络传输的流数据
     * TextDecoder()解码器将字节流作为输入，并提供码位流作为输出, 二进制转换成文本
     */
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = '' // 用于存储未处理完的数据
    let accumulatedContent = '' // 累积的完整消息内容

    // 更新消息的辅助函数
    const updateMessage = (newContent, isStreaming = true) => {
      accumulatedContent += newContent
      // 创建新的消息对象以触发响应式更新
      const updatedMessage = {
        ...botMessage,
        content: accumulatedContent,
        isStreaming
      }
      // 更新消息列表中的指定消息
      messages.value[conversationId] = [
        ...messages.value[conversationId].slice(0, messageIndex),
        updatedMessage,
        ...messages.value[conversationId].slice(messageIndex + 1)
      ]
    }

    try {
      while (true) {
        // 读取数据流
        const { done, value } = await reader.read()
        if (done) break

        // 解码新的数据块并添加到缓冲区
        const chunk = decoder.decode(value, { stream: true })
        buffer += chunk

        // 按行分割数据并保留最后一个不完整的行
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        // 处理每一行数据
        for (const line of lines) {
          const trimmedLine = line.trim()
          // 跳过空行和非数据行
          if (!trimmedLine || !trimmedLine.startsWith('data: '))
            continue

          const data = trimmedLine.slice(5) // 移除 'data: ' 前缀
          if (data === '[DONE]') continue // 跳过结束标记

          try {
            // 解析 JSON 数据
            const json = JSON.parse(data)
            const content = json.choices?.[0]?.delta?.content
            if (content) {
              updateMessage(content) // 更新消息内容
            }
          } catch (error) {
            // 只记录非结束标记的解析错误
            if (!data.includes('[DONE]')) {
              console.error(
                '解析响应数据失败:',
                error,
                'data:',
                data
              )
            }
          }
        }
      }

      // 处理缓冲区中剩余的数据
      if (buffer) {
        const trimmedBuffer = buffer.trim()
        if (
          trimmedBuffer &&
          trimmedBuffer.startsWith('data: ') &&
          !trimmedBuffer.includes('[DONE]')
        ) {
          try {
            // 解析最后的响应数据, 去掉前缀'data:'
            const data = trimmedBuffer.slice(5)
            const json = JSON.parse(data)
            const content = json.choices?.[0]?.delta?.content
            if (content) {
              updateMessage(content)
            }
          } catch (error) {
            console.error(
              '解析最后的响应数据失败:',
              error,
              'buffer:',
              buffer
            )
          }
        }
      }
    } catch (error) {
      console.error('流式响应处理错误:', error)
      throw error
    } finally {
      // 完成流式处理，更新消息状态
      updateMessage('', false)
    }
  }

  // 发送消息
  async function sendMessage(content) {
    // 创建用户消息
    const userMessage = {
      id: uuidv4(),
      role: 'user',
      content,
      timestamp: Date.now()
    }

    const conversationId = currentConversationId.value

    // 添加到消息列表
    if (!messages.value[conversationId]) {
      messages.value[conversationId] = []
    }
    messages.value[conversationId].push(userMessage)

    // 如果是第一条消息，生成对话标题
    if (messages.value[conversationId].length === 1) {
      const title = await generateTitle(content)
      const conversation = conversations.value.find(
        (conv) => conv.id === conversationId
      )
      if (conversation) {
        conversation.title = title
      }
    }

    // 为每个激活的机器人创建回复
    const botPromises = botStore.activeBots.map(async (botId) => {
      const botConfig = botStore.getBotConfig(botId)
      if (!botConfig) return

      // 创建机器人回复消息
      const botMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        botId,
        isStreaming: true
      }

      // 添加到消息列表
      messages.value[conversationId].push(botMessage)
      const messageIndex = messages.value[conversationId].length - 1

      try {
        const response = await fetch(
          `${botConfig.baseUrl}/chat/completions`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${botConfig.apiKey}`
            },
            // 不要把其他机器人的对话搞混了
            body: JSON.stringify({
              model: botConfig.model,
              messages: currentBotMessages
                .value(botId)
                .filter((msg) => !msg.isError)
                .map((msg) => ({
                  role: msg.role,
                  content: msg.content
                })),
              stream: true
            })
          }
        )

        if (!response.ok) {
          throw new Error(
            `API请求失败: ${response.status} ${response.statusText}`
          )
        }

        await handleStreamResponse(
          response,
          botMessage,
          conversationId,
          messageIndex
        )
      } catch (error) {
        const errorMessage = {
          ...botMessage,
          isError: true,
          content: '发送失败：' + (error || '未知错误'),
          isStreaming: false
        }
        messages.value[conversationId].splice(
          messageIndex,
          1,
          errorMessage
        )
      }
    })

    await Promise.all(botPromises)
  }

  // 重置所有对话记录到初始状态
  function resetChats() {
    conversations.value = [DEFAULT_CONVERSATION]
    currentConversationId.value = 'default'
    messages.value = {
      default: []
    }
  }

  return {
    // 状态
    conversations,
    currentConversationId,
    messages,
    // 计算属性
    currentMessages,
    currentBotMessages,
    // 方法
    createNewConversation,
    setCurrentConversation,
    deleteConversation,
    sendMessage,
    resetChats
  }
}, {
  persist: true
})
