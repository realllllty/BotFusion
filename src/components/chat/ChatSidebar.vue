<template>
  <div class="chat-sidebar">
    <!-- <div class="chat-sidebar__header">
      <div class="chat-sidebar__logo">
        <v-icon size="32" color="primary">mdi-robot-excited</v-icon>
        <span class="chat-sidebar__title">BotFusion</span>
      </div>
    </div> -->
    <v-list>
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
      <v-list-item prepend-icon="mdi-plus" title="添加机器人" @click="$emit('show-bot-dialog')" />
      <v-list-item v-for="bot in botConfigs" :key="bot.id" :title="bot.name" :subtitle="bot.model">
        <template v-slot:append>
          <div class="chat-sidebar__bot-actions">
            <v-btn icon size="small" variant="text" @click.stop="$emit('edit-bot', bot)">
              <v-icon>mdi-cog</v-icon>
              <v-tooltip activator="parent" location="top">编辑机器人</v-tooltip>
            </v-btn>
            <v-btn v-if="bot.id !== 'default'" icon size="small" variant="text" color="error"
              @click.stop="$emit('remove-bot', bot.id)">
              <v-icon>mdi-delete-outline</v-icon>
              <v-tooltip activator="parent" location="top">删除机器人</v-tooltip>
            </v-btn>
          </div>
        </template>
      </v-list-item>

      <v-divider class="my-2" />

      <!-- 对话列表 -->
      <v-list-subheader>对话列表</v-list-subheader>
      <v-list-item prepend-icon="mdi-plus" title="新建对话" @click="$emit('create-conversation')" />
      <v-list-item v-for="conversation in conversations" :key="conversation.id" :title="conversation.title"
        :active="currentConversationId === conversation.id" @click="$emit('set-conversation', conversation.id)">
        <template v-slot:append>
          <div class="chat-sidebar__conversation-actions">
            <v-btn icon size="small" variant="text" color="error" :disabled="conversations.length === 1"
              @click.stop="$emit('delete-conversation', conversation.id)">
              <v-icon>mdi-delete-outline</v-icon>
              <v-tooltip activator="parent" location="top">删除对话</v-tooltip>
            </v-btn>
          </div>
        </template>
      </v-list-item>
    </v-list>
  </div>
</template>

<script setup>
import { useTheme } from 'vuetify'

const props = defineProps({
  botConfigs: {
    type: Array,
    required: true
  },
  conversations: {
    type: Array,
    required: true
  },
  currentConversationId: {
    type: String,
    required: true
  }
})

defineEmits([
  'show-bot-dialog',
  'edit-bot',
  'remove-bot',
  'create-conversation',
  'set-conversation',
  'delete-conversation'
])

const theme = useTheme()
</script>

<style lang="scss" scoped>
.chat-sidebar {
  width: 300px;
  border-right: 1px solid rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;

  &__header {
    padding: 16px;
  }

  &__logo {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__title {
    font-size: 1.25rem;
    font-weight: 500;
  }

  &__bot-actions,
  &__conversation-actions {
    display: flex;
    align-items: center;
    gap: 4px;
  }
}

:root[data-theme="dark"] {
  .chat-sidebar {
    border-color: rgba(255, 255, 255, 0.12);
  }
}
</style>
