import { defineStore } from 'pinia'

async function streamResponse(response, conversation, botId) {
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  // 创建一个新的消息对象
  const aiMessage = {
    id: Date.now().toString(),
    role: 'assistant',
    botId,
    content: '',
    timestamp: new Date().toISOString(),
    isStreaming: true
  }

  // 使用新的消息对象替换数组中的元素，以确保响应式
  const messageIndex = conversation.messages.push(aiMessage) - 1

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      // 解码新的数据块
      const chunk = decoder.decode(value, { stream: true })
      buffer += chunk

      // 处理所有完整的消息
      const lines = buffer.split('\n')
      buffer = lines.pop() || '' // 保留最后一个不完整的行

      for (const line of lines) {
        const trimmedLine = line.trim()
        if (!trimmedLine || !trimmedLine.startsWith('data: ')) continue

        const data = trimmedLine.slice(5)
        if (data === '[DONE]') {
          continue
        }

        try {
          const json = JSON.parse(data)
          const content = json.choices?.[0]?.delta?.content
          if (content) {
            // 创建新的消息对象来触发响应式更新
            const updatedMessage = { ...conversation.messages[messageIndex] }
            updatedMessage.content += content
            conversation.messages.splice(messageIndex, 1, updatedMessage)
          }
        } catch (error) {
          if (!data.includes('[DONE]')) {
            console.error('解析响应数据失败:', error, 'data:', data)
          }
        }
      }
    }

    // 处理缓冲区中剩余的数据
    if (buffer) {
      const trimmedBuffer = buffer.trim()
      if (trimmedBuffer &&
        trimmedBuffer.startsWith('data: ') &&
        !trimmedBuffer.includes('[DONE]')) {
        try {
          const data = trimmedBuffer.slice(5)
          const json = JSON.parse(data)
          const content = json.choices?.[0]?.delta?.content
          if (content) {
            // 创建新的消息对象来触发响应式更新
            const updatedMessage = { ...conversation.messages[messageIndex] }
            updatedMessage.content += content
            conversation.messages.splice(messageIndex, 1, updatedMessage)
          }
        } catch (error) {
          console.error('解析最后的响应数据失败:', error, 'buffer:', buffer)
        }
      }
    }
  } catch (error) {
    console.error('流式响应处理错误:', error)
  } finally {
    // 最后一次更新，确保isStreaming状态改变也触发响应式更新
    const finalMessage = { ...conversation.messages[messageIndex] }
    finalMessage.isStreaming = false
    conversation.messages.splice(messageIndex, 1, finalMessage)
  }
}

// 添加总结对话的方法
async function summarizeConversation(message) {
  const defaultBot = this.botConfigs.find(b => b.id === 'default')
  if (!defaultBot?.apiKey) return message.slice(0, 20) + (message.length > 20 ? '...' : '')

  try {
    const response = await fetch(`${defaultBot.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${defaultBot.apiKey}`
      },
      body: JSON.stringify({
        model: defaultBot.model,
        messages: [
          {
            role: 'system',
            content: '你是一个对话总结助手。请用简短的一句话总结用户的输入内容，不要超过15个字。不要带有标点符号。'
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.7,
        max_tokens: 60,
        stream: false
      })
    })

    if (!response.ok) {
      throw new Error('总结生成失败')
    }

    const result = await response.json()
    return result.choices[0].message.content.trim()
  } catch (error) {
    console.error('生成总结失败:', error)
    return message.slice(0, 20) + (message.length > 20 ? '...' : '')
  }
}

export const useChat = defineStore('chat', {
  state: () => ({
    // 对话列表
    conversations: [],
    currentConversationId: null,
    // 机器人配置
    botConfigs: [
      {
        id: 'default',
        name: '默认助手',
        baseUrl: 'https://api.openai.com/v1',
        apiKey: '',
        model: 'gpt-3.5-turbo'
      }
    ],
    activeBots: ['default'],
    columnWidths: {}
  }),

  getters: {
    currentConversation: (state) =>
      state.conversations.find(conv => conv.id === state.currentConversationId),

    // 获取当前对话中每个机器人的消息
    currentBotMessages: (state) => (botId) => {
      const conversation = state.conversations.find(
        conv => conv.id === state.currentConversationId
      )
      if (!conversation) return []
      return conversation.messages.filter(msg =>
        msg.role === 'user' || msg.botId === botId
      )
    }
  },

  actions: {
    createNewConversation() {
      const newConversation = {
        id: Date.now().toString(),
        title: '新对话',
        messages: []
      }
      this.conversations.unshift(newConversation)
      this.currentConversationId = newConversation.id
      this.saveToLocalStorage()
    },

    setCurrentConversation(conversationId) {
      this.currentConversationId = conversationId
    },

    addBot(config) {
      const newBot = {
        id: Date.now().toString(),
        name: config.name,
        baseUrl: config.baseUrl || 'https://api.openai.com/v1',
        apiKey: config.apiKey,
        model: config.model || 'gpt-3.5-turbo'
      }
      this.botConfigs.push(newBot)
      this.activeBots.push(newBot.id)
      this.saveToLocalStorage()
      return newBot.id
    },

    removeBot(botId) {
      if (botId === 'default') return

      const index = this.activeBots.indexOf(botId)
      if (index > -1) {
        this.activeBots.splice(index, 1)
      }

      this.botConfigs = this.botConfigs.filter(bot => bot.id !== botId)

      // 从所有对话中移除该机器人的消息
      this.conversations.forEach(conv => {
        conv.messages = conv.messages.filter(msg => msg.botId !== botId)
      })

      this.saveToLocalStorage()
    },

    updateBotConfig(botId, config) {
      const bot = this.botConfigs.find(b => b.id === botId)
      if (bot) {
        bot.name = config.name
        bot.baseUrl = config.baseUrl || 'https://api.openai.com/v1'
        bot.apiKey = config.apiKey
        bot.model = config.model || 'gpt-3.5-turbo'
        this.saveToLocalStorage()
      }
    },

    setColumnWidth(botId, width) {
      this.columnWidths[botId] = width
      localStorage.setItem('column_widths', JSON.stringify(this.columnWidths))
    },

    async sendMessage(content) {
      if (!this.currentConversationId) {
        this.createNewConversation()
      }

      const conversation = this.conversations.find(
        conv => conv.id === this.currentConversationId
      )

      // 添加用户消息
      const userMessage = {
        id: Date.now().toString(),
        role: 'user',
        content,
        timestamp: new Date().toISOString()
      }
      conversation.messages.push(userMessage)

      // 如果是第一条消息，生成总结作为标题
      if (conversation.messages.length === 1) {
        conversation.title = await summarizeConversation.call(this, content)
      }

      // 为每个活跃的机器人发送消息
      const promises = this.activeBots.map(async botId => {
        const bot = this.botConfigs.find(b => b.id === botId)
        if (!bot) return

        try {
          const response = await fetch(`${bot.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${bot.apiKey}`
            },
            body: JSON.stringify({
              model: bot.model,
              messages: conversation.messages
                .filter(msg => msg.role === 'user' || msg.botId === botId)
                .map(msg => ({
                  role: msg.role,
                  content: msg.content
                })),
              stream: true // 启用流式输出
            })
          })

          if (!response.ok) {
            throw new Error(`${bot.name}: API请求失败`)
          }

          await streamResponse(response, conversation, botId)
        } catch (error) {
          console.error(`${bot.name} API调用失败:`, error)
          // 添加错误消息
          conversation.messages.push({
            id: Date.now().toString(),
            role: 'assistant',
            botId,
            content: `错误: ${error.message}`,
            timestamp: new Date().toISOString(),
            isError: true
          })
        }
      })

      try {
        await Promise.all(promises)
      } finally {
        this.saveToLocalStorage()
      }
    },

    saveToLocalStorage() {
      localStorage.setItem('conversations', JSON.stringify(this.conversations))
      localStorage.setItem('currentConversationId', this.currentConversationId)
      localStorage.setItem('botConfigs', JSON.stringify(this.botConfigs))
      localStorage.setItem('activeBots', JSON.stringify(this.activeBots))
    },

    loadFromLocalStorage() {
      const savedConversations = localStorage.getItem('conversations')
      const savedCurrentConversationId = localStorage.getItem('currentConversationId')
      const savedBotConfigs = localStorage.getItem('botConfigs')
      const savedActiveBots = localStorage.getItem('activeBots')
      const savedColumnWidths = localStorage.getItem('column_widths')

      if (savedConversations) {
        this.conversations = JSON.parse(savedConversations)
      }
      if (savedCurrentConversationId) {
        this.currentConversationId = savedCurrentConversationId
      }
      if (savedBotConfigs) {
        this.botConfigs = JSON.parse(savedBotConfigs)
      }
      if (savedActiveBots) {
        this.activeBots = JSON.parse(savedActiveBots)
      }
      if (savedColumnWidths) {
        this.columnWidths = JSON.parse(savedColumnWidths)
      }
    },

    deleteConversation(conversationId) {
      // 如果要删除的是当前对话，先切换到其他对话
      if (conversationId === this.currentConversationId) {
        const otherConversation = this.conversations.find(c => c.id !== conversationId)
        if (otherConversation) {
          this.currentConversationId = otherConversation.id
        }
      }

      // 从列表中删除对话
      this.conversations = this.conversations.filter(c => c.id !== conversationId)

      // 如果没有对话了，创建一个新的
      if (this.conversations.length === 0) {
        this.createNewConversation()
      }

      // 保存到本地存储
      this.saveToLocalStorage()
    }
  }
})
