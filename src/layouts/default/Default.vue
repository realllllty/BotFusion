<template>
  <v-app>
    <!-- Header -->
    <!-- <v-app-bar flat class="app-bar">
      <v-app-bar-nav-icon @click="drawer = !drawer" />
      <div class="app-bar__brand">
        <v-icon icon="mdi-robot" size="large" class="app-bar__icon" />
        <div class="app-bar__title">
          <span class="app-bar__title-primary">Bot</span>
          <span class="app-bar__title-secondary">Fusion</span>
        </div>
      </div>
      <v-spacer></v-spacer>
    </v-app-bar> -->

    <!-- Drawer：集成 ChatSidebar -->
    <v-navigation-drawer
      v-model="drawer"
      permanent
      width="320"
      class="navigation-drawer"
      expand-on-hover
      rail-width="73"
      rail
      floating
    >
      <ChatSidebar
        :conversations="chatStore.conversations"
        :current-conversation-id="chatStore.currentConversationId"
        @create-conversation="chatStore.createNewConversation"
        @set-conversation="chatStore.setCurrentConversation"
        @delete-conversation="chatStore.deleteConversation"
        @show-settings="showSettings"
      />
    </v-navigation-drawer>

    <!-- 主内容区：路由视图 -->
    <v-main>
      <router-view />
    </v-main>

    <!-- 机器人配置对话框 -->
    <BotConfigDialog v-model="showBotDialog" :editing-bot="editingBot" @save="saveBotConfig" />

    <!-- 设置对话框 -->
    <SettingsDialog v-model="showSettingsDialog" :bot-configs="botStore.botConfigs"
      @show-bot-dialog="showBotDialog = true" @edit-bot="editBot" @remove-bot="botStore.removeBot" />
  </v-app>
</template>

<script setup>
import { ref } from 'vue'
import { useChatStore } from '@/stores/chat'
import { useBotStore } from '@/stores/bot'
import { useDisplay } from 'vuetify'
import ChatSidebar from '@/components/chat/ChatSidebar.vue'
import BotConfigDialog from '@/components/BotConfigDialog.vue'
import SettingsDialog from '@/components/SettingsDialog.vue'

const chatStore = useChatStore()
const botStore = useBotStore()
const display = useDisplay()

const drawer = ref(true)
const showBotDialog = ref(false)
const editingBot = ref(null)
const showSettingsDialog = ref(false)

// 设置对话框
const showSettings = () => {
  showSettingsDialog.value = true;
}

// 编辑机器人
const editBot = (bot) => {
  editingBot.value = bot
  showBotDialog.value = true
}

const saveBotConfig = (config) => {
  try {
    if (editingBot.value) {
      botStore.updateBotConfig(editingBot.value.id, config)
    } else {
      botStore.addBot(config)
    }
    showBotDialog.value = false
    editingBot.value = null
  } catch (error) {
    console.error('保存机器人配置失败:', error)
    alert('保存失败: ' + (error.message || '未知错误'))
  }
}
</script>

<style lang="scss" scoped>
// 应用栏样式
.app-bar {
  padding: 0 16px;

  &__brand {
    display: flex;
    align-items: center;
    margin-left: 16px;
  }

  &__icon {
    margin-right: 8px;
    color: rgb(var(--v-theme-primary));
  }

  &__title {
    display: flex;
    font-size: 1.5rem;
    font-weight: 700;

    &-primary {
      color: rgb(var(--v-theme-primary));
    }

    &-secondary {
      color: currentColor;
    }
  }
}

// 导航抽屉样式
.navigation-drawer {
  padding: 0;
  border-radius: 8px;
  margin: 10px;
  height: calc(100vh - 20px) !important;
}

:deep(.chat-sidebar) {
  width: 100%;
  height: 100%;

  .v-list {
    padding: 8px;
    height: 100%;
    overflow-y: auto;
  }
}

:deep(.chat-sidebar__bot-actions),
:deep(.chat-sidebar__conversation-actions) {
  margin-right: 8px;
}

.v-main {
  height: calc(100vh - 64px);
  width: 100%;
}
</style>
