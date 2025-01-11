<template>
  <div class="chat-container">
    <!-- 侧边栏 -->
    <div class="sidebar">
      <div class="app-header">
        <div class="app-logo">
          <v-icon size="32" color="primary">mdi-robot-excited</v-icon>
          <span class="app-title">BotFusion</span>
        </div>
      </div>
      <v-list class="sidebar-content">
        <!-- 主题切换 -->
        <v-list-item>
          <template v-slot:prepend>
            <v-icon :icon="theme.global.current.value.dark ? 'mdi-weather-night' : 'mdi-weather-sunny'"
              :color="theme.global.current.value.dark ? 'blue-lighten-3' : 'amber-darken-2'" />
          </template>
          <v-list-item-title>{{ theme.global.current.value.dark ? '深色模式' : '浅色模式' }}</v-list-item-title>
          <template v-slot:append>
            <v-switch v-model="theme.global.name.value" :true-value="'dark'" :false-value="'light'" hide-details inset
              density="compact" />
          </template>
        </v-list-item>

        <v-divider class="my-2" />

        <!-- 机器人管理 -->
        <v-list-subheader>机器人管理</v-list-subheader>
        <v-list-item prepend-icon="mdi-plus" title="添加机器人" @click="showBotDialog = true" />
        <v-list-item v-for="bot in botConfigs" :key="bot.id" :title="bot.name" :subtitle="bot.model">
          <template v-slot:append>
            <div class="d-flex align-center">
              <v-btn icon size="small" variant="text" @click.stop="editBot(bot)">
                <v-icon>mdi-cog</v-icon>
                <v-tooltip activator="parent" location="top">编辑机器人</v-tooltip>
              </v-btn>
              <v-btn v-if="bot.id !== 'default'" icon size="small" variant="text" color="error"
                @click.stop="removeBot(bot.id)">
                <v-icon>mdi-delete-outline</v-icon>
                <v-tooltip activator="parent" location="top">删除机器人</v-tooltip>
              </v-btn>
            </div>
          </template>
        </v-list-item>

        <v-divider class="my-2" />

        <!-- 对话列表 -->
        <v-list-subheader>对话列表</v-list-subheader>
        <v-list-item prepend-icon="mdi-plus" title="新建对话" @click="createNewConversation" />
        <v-list-item v-for="conversation in conversations" :key="conversation.id" :title="conversation.title"
          :active="currentConversationId === conversation.id" @click="setCurrentConversation(conversation.id)">
          <template v-slot:append>
            <div class="d-flex align-center">
              <v-btn icon size="small" variant="text" color="error" :disabled="conversations.length === 1"
                @click.stop="deleteConversation(conversation.id)">
                <v-icon>mdi-delete-outline</v-icon>
                <v-tooltip activator="parent" location="top">删除对话</v-tooltip>
              </v-btn>
            </div>
          </template>
        </v-list-item>
      </v-list>
    </div>

    <!-- 聊天区域 -->
    <div class="chat-area">
      <div class="chat-columns-container">
        <template v-for="botId in activeBots" :key="botId">
          <!-- 单个机器人的聊天列 -->
          <div class="chat-column" :style="{
            width: columnWidths[botId] || `${100 / activeBots.length}%`,
            minWidth: '300px'
          }">
            <!-- 顶部工具栏 -->
            <v-toolbar density="comfortable" color="surface" elevation="1" rounded="lg" class="mb-2">
              <v-toolbar-title>{{ getBotName(botId) }}</v-toolbar-title>
              <v-spacer />
            </v-toolbar>

            <!-- 消息列表 -->
            <div class="message-container" :ref="el => { if (el) messageContainers[botId] = el }">
              <template v-for="message in getBotMessages(botId)" :key="message.id">
                <div :class="['message-wrapper', message.role === 'user' ? 'message-user' : 'message-bot']">
                  <v-card :class="['message-card', message.isError ? 'error-message' : '']"
                    :color="message.role === 'user' ? 'primary' : 'surface'"
                    :variant="message.role === 'user' ? 'flat' : 'elevated'" elevation="1">
                    <!-- 消息头部 -->
                    <v-card-item class="message-header py-1 px-4">
                      <template v-slot:prepend>
                        <v-avatar :color="message.role === 'user' ? 'primary-darken-1' : 'primary'"
                          :variant="message.role === 'user' ? 'flat' : 'tonal'">
                          <v-icon :icon="message.role === 'user' ? 'mdi-account' : 'mdi-robot'"
                            :color="message.role === 'user' ? 'white' : 'primary'" />
                        </v-avatar>
                      </template>
                      <v-card-title class="text-subtitle-2">
                        {{ message.role === 'user' ? '你' : getBotName(botId) }}
                      </v-card-title>
                      <v-card-subtitle class="text-caption">
                        {{ formatTime(message.timestamp) }}
                      </v-card-subtitle>
                    </v-card-item>

                    <!-- 消息内容 -->
                    <v-card-text :class="['pa-4', message.role === 'user' ? 'text-white' : '']">
                      <div :class="[
                        'message-content',
                        message.role === 'assistant' ? 'markdown-body' : '',
                        message.isStreaming ? 'streaming' : ''
                      ]" v-if="message.role === 'assistant'" v-html="renderMarkdown(message.content)" />
                      <div v-else>{{ message.content }}</div>
                      <div v-if="message.isStreaming" class="streaming-indicator">
                        <span class="dot"></span>
                        <span class="dot"></span>
                        <span class="dot"></span>
                      </div>
                    </v-card-text>

                    <!-- 消息操作按钮 -->
                    <v-card-actions v-if="message.role === 'assistant'" class="pa-2">
                      <v-spacer />
                      <v-btn variant="text" density="comfortable" prepend-icon="mdi-content-copy"
                        @click="copyMessage(message.content)">
                        复制
                      </v-btn>
                    </v-card-actions>
                  </v-card>
                </div>
              </template>
            </div>
          </div>

          <!-- 列分隔符 -->
          <div v-if="botId !== activeBots[activeBots.length - 1]" class="column-resizer"
            @mousedown="startResize($event, botId)" />
        </template>
      </div>
    </div>

    <!-- 底部输入区域 -->
    <div class="footer">
      <v-container fluid>
        <v-textarea v-model="inputMessage" placeholder="输入消息..." variant="outlined" density="comfortable" hide-details
          rows="3" auto-grow :max-rows="4" class="input-textarea" @keydown.enter.prevent="sendMessage" />
        <v-btn color="primary" block :loading="isLoading" :disabled="!inputMessage.trim()" elevation="1"
          @click="sendMessage">
          <v-icon start>mdi-send</v-icon>
          发送到所有机器人
        </v-btn>
      </v-container>
    </div>

    <!-- 机器人配置对话框 -->
    <v-dialog v-model="showBotDialog" width="500">
      <v-card>
        <v-card-title>{{ editingBot ? '编辑机器人' : '添加机器人' }}</v-card-title>
        <v-card-text>
          <v-text-field v-model="botForm.name" label="名称" required />
          <v-text-field v-model="botForm.baseUrl" label="Base URL" placeholder="https://api.openai.com/v1" />
          <v-text-field v-model="botForm.apiKey" label="API Key" type="password" />
          <v-text-field v-model="botForm.model" label="Model Name" placeholder="gpt-3.5-turbo" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" @click="saveBotConfig">
            保存
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useTheme } from 'vuetify'
import { useChat } from '@/stores/chat'
import { Marked } from 'marked'
import hljs from 'highlight.js'
import { markedHighlight } from "marked-highlight";
import DOMPurify from 'dompurify'
// import "highlight.js/styles/monokai-sublime.css";
import 'highlight.js/styles/github-dark.css';


// marked.setOptions({
//   highlight: function (code) {
//     const language = hljs.getLanguage(lang) ? lang : 'plaintext';
//     return hljs.highlight(code, { language }).value;
//   },
//   langPrefix: 'hljs language-'
// })

const marked = new Marked(
  markedHighlight({
    emptyLangClass: 'hljs',
    langPrefix: 'hljs language-',
    highlight(code, lang, info) {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext';
      return hljs.highlight(code, { language }).value;
    }
  })
);

const theme = useTheme()
const chatStore = useChat()

// 状态
const inputMessage = ref('')
const isLoading = ref(false)
const showBotDialog = ref(false)
const editingBot = ref(null)
const botForm = ref({
  name: '',
  baseUrl: 'https://api.openai.com/v1',
  apiKey: '',
  model: 'gpt-3.5-turbo'
})
const columnWidths = ref({})
let resizingColumn = null

// 从store获取数据
const botConfigs = computed(() => chatStore.botConfigs)
const activeBots = computed(() => chatStore.activeBots)
const conversations = computed(() => chatStore.conversations)
const currentConversationId = computed(() => chatStore.currentConversationId)

// 添加消息容器的引用
const messageContainers = ref({})

// 方法
const toggleTheme = () => {
  theme.global.name.value = theme.global.current.value.dark ? 'light' : 'dark'
}

const getBotName = (botId) => {
  const bot = botConfigs.value.find(b => b.id === botId)
  return bot ? bot.name : '未知机器人'
}

const getBotMessages = (botId) => {
  const messages = chatStore.currentBotMessages(botId)
  // 当消息更新时，滚动到底部
  nextTick(() => {
    const container = messageContainers.value[botId]
    if (container) {
      container.scrollTop = container.scrollHeight
    }
  })
  return messages
}

const createNewConversation = () => {
  chatStore.createNewConversation()
}

const setCurrentConversation = (conversationId) => {
  chatStore.setCurrentConversation(conversationId)
}

const sendMessage = async () => {
  if (!inputMessage.value.trim() || isLoading.value) return

  const message = inputMessage.value
  inputMessage.value = ''
  isLoading.value = true

  try {
    await chatStore.sendMessage(message)
  } catch (error) {
    console.error('发送消息失败:', error)
    alert('发送消息失败: ' + (error.message || '未知错误'))
    inputMessage.value = message
  } finally {
    isLoading.value = false
  }
}

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString()
}

const editBot = (bot) => {
  editingBot.value = bot
  botForm.value = { ...bot }
  showBotDialog.value = true
}

const saveBotConfig = () => {
  // 添加表单验证
  if (!botForm.value.name?.trim()) {
    alert('请输入机器人名称')
    return
  }
  if (!botForm.value.apiKey?.trim()) {
    alert('请输入API Key')
    return
  }
  if (!botForm.value.model?.trim()) {
    alert('请输入模型名称')
    return
  }

  const config = {
    name: botForm.value.name.trim(),
    baseUrl: botForm.value.baseUrl.trim() || 'https://api.openai.com/v1',
    apiKey: botForm.value.apiKey.trim(),
    model: botForm.value.model.trim()
  }

  try {
    if (editingBot.value) {
      chatStore.updateBotConfig(editingBot.value.id, config)
    } else {
      const newBotId = chatStore.addBot(config)
      console.log('新机器人ID:', newBotId)
    }
    showBotDialog.value = false
    editingBot.value = null
    botForm.value = {
      name: '',
      baseUrl: 'https://api.openai.com/v1',
      apiKey: '',
      model: 'gpt-3.5-turbo'
    }
  } catch (error) {
    console.error('保存机器人配置失败:', error)
    alert('保存失败: ' + (error.message || '未知错误'))
  }
}

const removeBot = (botId) => {
  if (confirm('确定要删除这个机器人吗？相关的对话记录也会被删除。')) {
    chatStore.removeBot(botId)
  }
}

// 列宽调整
const startResize = (event, botId) => {
  resizingColumn = botId
  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', stopResize)
}

const handleResize = (event) => {
  if (!resizingColumn) return

  const container = event.target.closest('.chat-column')
  if (!container) return

  const newWidth = event.clientX - container.getBoundingClientRect().left
  chatStore.setColumnWidth(resizingColumn, `${newWidth}px`)
}

const stopResize = () => {
  resizingColumn = null
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
}

onUnmounted(() => {
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
})

onMounted(() => {
  chatStore.loadFromLocalStorage()
})

const renderMarkdown = (content) => {
  const html = marked.parse(content)
  return DOMPurify.sanitize(html)
}

const copyMessage = async (content) => {
  try {
    await navigator.clipboard.writeText(content)
    // 可以添加一个提示，表示复制成功
  } catch (err) {
    console.error('复制失败:', err)
  }
}

const deleteConversation = (conversationId) => {
  if (confirm('确定要删除这个对话吗？此操作不可恢复。')) {
    chatStore.deleteConversation(conversationId)
  }
}
</script>

<style scoped>
.chat-container {
  height: 100vh;
  display: flex;
  overflow: hidden;
  background: rgb(var(--v-theme-background));
  position: relative;
}

.chat-container::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg,
      rgba(var(--v-theme-primary), 0.05) 0%,
      rgba(var(--v-theme-surface), 0.05) 100%);
  pointer-events: none;
  z-index: 0;
}

.sidebar {
  width: 280px;
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  background: rgba(var(--v-theme-surface), 0.95);
  backdrop-filter: blur(10px);
  z-index: 3;
  display: flex;
  flex-direction: column;
  border-right: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  box-shadow: var(--v-elevation-2);
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.sidebar-content :deep(.v-list) {
  padding: 8px;
  border-radius: 12px;
  background: transparent;
}

.sidebar-content :deep(.v-list-item) {
  margin-bottom: 4px;
  border-radius: 8px;
  min-height: 44px;
}

.sidebar-content :deep(.v-list-item--active) {
  background: rgba(var(--v-theme-primary), 0.15);
}

.sidebar-content :deep(.v-list-item--active::before) {
  opacity: 0;
}

.sidebar-content :deep(.v-list-subheader) {
  font-size: 0.875rem;
  font-weight: 600;
  padding: 0 12px;
  min-height: 36px;
}

.chat-area {
  flex: 1;
  margin-left: 280px;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding-bottom: 160px;
}

.chat-columns-container {
  flex: 1;
  display: flex;
  height: 100%;
  overflow-x: auto;
  padding: 16px;
  gap: 0;
  align-items: stretch;
  background: var(--v-theme-background);
}

.chat-column {
  display: flex;
  flex-direction: column;
  height: 100%;
  flex: 1;
  min-width: 300px;
  position: relative;
  background: rgba(var(--v-theme-surface), 0.9);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  margin: 0 8px;
  box-shadow: var(--v-elevation-2);
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.chat-column:first-child {
  margin-left: 0;
}

.chat-column:last-child {
  margin-right: 0;
}

.message-container {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  padding-bottom: 2rem;
  word-break: break-word;
  height: calc(100vh - 220px);
}

.message-wrapper {
  padding: 0.75rem 1rem;
  width: 100%;
  max-width: 100%;
  margin-bottom: 1rem;
  transition: transform 0.2s ease;
}

.message-wrapper:hover {
  transform: translateY(-1px);
}

.message-user {
  margin-left: auto;
}

.message-bot {
  margin-right: auto;
}

.message-card {
  width: 100%;
  max-width: 100%;
  margin: 0;
  overflow: hidden;
  transition: all 0.3s ease;
  border-radius: 12px;
  background: rgba(var(--v-theme-surface), 0.95);
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.message-card:hover {
  box-shadow: var(--v-elevation-4);
}

.message-header {
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background: rgba(var(--v-theme-surface-variant), 0.3);
  padding: 8px 16px !important;
}

.message-content {
  overflow-wrap: break-word;
  word-wrap: break-word;
  word-break: break-word;
  hyphens: auto;
  white-space: pre-wrap;
  padding: 16px !important;
}

.message-card :deep(.v-card-text) {
  padding: 16px !important;
}

.message-card :deep(.v-card-actions) {
  padding: 8px 16px !important;
  min-height: 48px;
}

/* 用户消息特殊样式 */
.message-user .v-card-text {
  padding-top: 8px;
}

/* 错误消息样式 */
.error-message {
  border: 1px solid rgb(var(--v-theme-error));
}

.error-message .message-header {
  background-color: rgb(var(--v-theme-error), 0.1);
}

/* 适配深色模式 */
:deep(.v-theme--dark) .message-card:not(.v-card--variant-elevated) {
  border-color: rgba(var(--v-border-color), var(--v-border-opacity));
}

/* 调整markdown样式以适应新的卡片样式 */
.markdown-body pre {
  margin: 0.5em 0;
  border-radius: 8px;
  background: rgba(var(--v-theme-surface-variant), 0.3);
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow-x: hidden;
}

.markdown-body pre code {
  white-space: pre-wrap;
  word-wrap: break-word;
}

.markdown-body code {
  font-family: 'Fira Code', monospace;
  background: rgba(var(--v-theme-surface-variant), 0.3);
  padding: 0.2em 0.4em;
  border-radius: 4px;
  word-wrap: break-word;
  white-space: pre-wrap;
}

.markdown-body :deep(code) {
  font-family: 'Fira Code', monospace;
}

.markdown-body :deep(p:first-child) {
  margin-top: 0;
}

.markdown-body :deep(p:last-child) {
  margin-bottom: 0;
}

.column-resizer {
  width: 8px;
  background: transparent;
  cursor: col-resize;
  transition: all 0.3s ease;
  position: relative;
  margin: 16px -4px;
  z-index: 2;
}

.column-resizer::after {
  content: '';
  position: absolute;
  left: 3px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: rgba(var(--v-theme-on-surface), 0.08);
  transition: all 0.3s ease;
  border-radius: 4px;
}

.column-resizer:hover::after {
  background: rgba(var(--v-theme-primary), 0.5);
  width: 4px;
  left: 2px;
  box-shadow: 0 0 8px rgba(var(--v-theme-primary), 0.3);
}

.footer {
  height: 160px;
  position: fixed;
  bottom: 0;
  left: 280px;
  right: 0;
  background: rgba(var(--v-theme-surface), 0.95);
  backdrop-filter: blur(20px);
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.08);
  z-index: 4;
}

.footer::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--v-theme-surface);
  opacity: 0.95;
  z-index: -1;
}

.footer .v-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 16px 24px !important;
  gap: 12px;
  max-width: 1200px;
  margin: 0 auto;
}

.input-textarea {
  flex: 1;
  min-height: 80px;
  background: rgba(var(--v-theme-surface), 0.95);
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 16px;
  margin-bottom: 8px;
  transition: all 0.3s ease;
}

.input-textarea:hover,
.input-textarea:focus-within {
  background: rgba(var(--v-theme-surface), 1);
  border-color: rgba(var(--v-theme-primary), 0.5);
}

.input-textarea :deep(.v-field__input) {
  min-height: 80px;
  padding: 12px 16px;
  max-height: 120px;
  overflow-y: auto;
  font-size: 1rem;
  line-height: 1.5;
}

.footer .v-btn {
  height: 48px;
  font-size: 1rem;
  letter-spacing: 0.5px;
  text-transform: none;
  margin-top: auto;
  border-radius: 12px;
  transition: all 0.3s ease;
}

/* 深色模式适配 */
:deep(.v-theme--dark) {
  .chat-container::before {
    background: linear-gradient(135deg,
        rgba(var(--v-theme-primary), 0.1) 0%,
        rgba(var(--v-theme-surface), 0.05) 100%);
  }

  .sidebar {
    background: rgba(var(--v-theme-surface), 0.85);
  }

  .chat-column {
    background: rgba(var(--v-theme-surface), 0.8);
  }

  .message-card {
    background: rgba(var(--v-theme-surface), 0.9);
  }

  .message-card.user-message {
    background: rgba(var(--v-theme-primary), 0.9);
  }

  .footer {
    background: rgba(var(--v-theme-surface), 0.85);
  }
}

/* 优化输入框样式 */
.input-textarea {
  flex: 1;
  min-height: 80px;
  background: rgba(var(--v-theme-surface), 0.95);
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 16px;
  margin-bottom: 8px;
  transition: all 0.3s ease;
}

.input-textarea:hover,
.input-textarea:focus-within {
  background: rgba(var(--v-theme-surface), 1);
  border-color: rgba(var(--v-theme-primary), 0.5);
}

/* 优化工具栏样式 */
.chat-column :deep(.v-toolbar) {
  background: rgba(var(--v-theme-surface), 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 16px 16px 0 0;
}

/* 优化列表项样式 */
.sidebar-content :deep(.v-list-item--active) {
  background: rgba(var(--v-theme-primary), 0.15);
}

.sidebar-content :deep(.v-list-item--active::before) {
  opacity: 0;
}

.sidebar-content :deep(.v-list-item:not(.v-list-item--active):hover) {
  background: rgba(var(--v-theme-surface-variant), 0.1);
}

.sidebar-content :deep(.v-list-item:not(.v-list-item--active):hover::before) {
  opacity: 0;
}

/* 添加新的样式 */
.app-header {
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.app-logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.app-title {
  font-size: 1.5rem;
  font-weight: 700;
  background: linear-gradient(45deg, rgb(var(--v-theme-primary)) 30%, rgb(var(--v-theme-secondary)));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: 0.5px;
}

/* 优化按钮样式 */
.v-btn {
  text-transform: none !important;
  letter-spacing: 0.5px !important;
  font-weight: 500 !important;
}

.v-btn--size-default {
  min-height: 40px !important;
}

.v-btn--variant-elevated {
  box-shadow: var(--v-shadow-elevation-2) !important;
}

.v-btn--variant-elevated:hover {
  box-shadow: var(--v-shadow-elevation-4) !important;
}

/* 深色模式优化 */
:deep(.v-theme--dark) {
  --v-shadow-key-umbra-opacity: rgba(0, 0, 0, 0.2);
  --v-shadow-key-penumbra-opacity: rgba(0, 0, 0, 0.14);
  --v-shadow-key-ambient-opacity: rgba(0, 0, 0, 0.12);
}

:deep(.v-theme--dark) .app-title {
  background: linear-gradient(45deg, rgb(var(--v-theme-primary)) 30%, rgb(var(--v-theme-secondary)));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

:deep(.v-theme--dark) .v-card {
  --v-theme-overlay-multiplier: 0.5;
}

:deep(.v-theme--dark) .v-btn--variant-elevated {
  background-color: rgba(var(--v-theme-surface), 0.9) !important;
}

/* 优化消息卡片在深色模式下的样式 */
:deep(.v-theme--dark) .message-card {
  background-color: rgba(var(--v-theme-surface), 0.8);
}

:deep(.v-theme--dark) .message-header {
  background-color: rgba(var(--v-theme-surface-variant), 0.1);
}

/* 优化滚动条在深色模式下的样式 */
:deep(.v-theme--dark) ::-webkit-scrollbar-thumb {
  background: rgba(var(--v-theme-on-surface), 0.15);
}

:deep(.v-theme--dark) ::-webkit-scrollbar-thumb:hover {
  background: rgba(var(--v-theme-on-surface), 0.25);
}

/* 优化输入区域在深色模式下的样式 */
:deep(.v-theme--dark) .footer::before {
  opacity: 0.92;
}

:deep(.v-theme--dark) .input-textarea {
  background: rgba(var(--v-theme-surface-variant), 0.1);
}

:deep(.v-theme--dark) .input-textarea:hover {
  background: rgba(var(--v-theme-surface-variant), 0.15);
}

/* 优化列表项在深色模式下的样式 */
:deep(.v-theme--dark) .v-list-item--active {
  background: rgba(var(--v-theme-primary), 0.15) !important;
}

:deep(.v-theme--dark) .v-list-item:not(.v-list-item--active):hover {
  background: rgba(var(--v-theme-surface-variant), 0.1) !important;
}

/* 添加列表项样式 */
.v-list-item {
  min-height: 48px !important;
}

.v-list-item :deep(.v-list-item__append) {
  margin-inline-start: 8px !important;
}

.v-list-item :deep(.v-btn--size-small) {
  width: 32px;
  height: 32px;
}

.v-list-item :deep(.v-btn--size-small .v-icon) {
  font-size: 20px;
}

.d-flex.align-center {
  gap: 4px;
}

/* 隐藏所有滚动条 */
* {
  scrollbar-width: none;
  /* Firefox */
  -ms-overflow-style: none;
  /* IE and Edge */
}

*::-webkit-scrollbar {
  display: none;
  /* Chrome, Safari and Opera */
}

/* 确保滚动功能仍然可用 */
.message-container,
.chat-columns-container,
.sidebar-content,
.input-textarea :deep(.v-field__input) {
  -webkit-overflow-scrolling: touch;
  /* 在iOS上保持平滑滚动 */
}
</style>
