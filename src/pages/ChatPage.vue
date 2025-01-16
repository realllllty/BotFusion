<template>
  <div class="chat">
    <ChatArea class="chat__area" :active-bots="botStore.activeBots" v-model:column-widths="columnWidths"
      :get-bot-name="getBotName" :get-bot-messages="chatStore.currentBotMessages" />

    <ChatInput class="chat__input" :is-loading="isLoading" @send="sendMessage" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useChatStore } from '@/stores/chat'
import { useBotStore } from '@/stores/bot'
import ChatArea from '@/components/chat/ChatArea.vue'
import ChatInput from '@/components/chat/ChatInput.vue'

const chatStore = useChatStore()
const botStore = useBotStore()

// 状态
const isLoading = ref(false)
const columnWidths = ref({})

// 方法
const getBotName = (botId) => {
  const bot = botStore.getBotConfig(botId)
  return bot ? bot.name : '未知机器人'
}

const sendMessage = async (message) => {
  isLoading.value = true
  try {
    await chatStore.sendMessage(message)
  } catch (error) {
    console.error('发送消息失败:', error)
    alert('发送消息失败: ' + (error.message || '未知错误'))
  } finally {
    isLoading.value = false
  }
}
</script>

<style lang="scss" scoped>
.chat {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  overflow: hidden;
  height: 100%;
  width: 100%;
  position: relative;

  // 聊天区域布局
  &__area {
    flex: 1;
    min-height: 0; // 防止 flex 子项溢出
    position: relative;
  }

  // 输入框布局
  &__input {
    background: rgb(var(--v-theme-background));
    border-top: 1px solid rgba(0, 0, 0, 0.12);
    height: 177px;
    width: 100%;
  }
}

:root[data-theme='dark'] {
  .chat__input {
    border-color: rgba(255, 255, 255, 0.12);
    background: rgb(var(--v-theme-surface));
  }
}
</style>
