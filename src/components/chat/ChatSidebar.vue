<template>
  <div class="chat-sidebar">
    <v-list>
      <!-- BotFusion 标题 -->
      <v-list-item class="chat-sidebar__brand">
        <template v-slot:prepend>
          <v-icon icon="mdi-robot" class="brand-icon" />
        </template>
        <template v-slot:title>
          <div class="brand-title">
            <span class="brand-title__primary">Bot</span>
            <span class="brand-title__secondary">Fusion</span>
          </div>
        </template>
      </v-list-item>

      <v-divider class="my-2" />

      <!-- 用户信息 -->
      <v-list-item class="chat-sidebar__userInfo">
        <template v-slot:prepend>
          <v-avatar :image="userStore.user.photoURL" size="24" />
        </template>
        <template v-slot:title>
          {{ userStore.user.name }}
        </template>
        <template v-slot:append>
          <v-btn icon size="small" variant="text" color="primary" @click="uploadGoogleDrive" :loading="isUploadLoading"
            :disabled="!userStore.isLoggedIn">
            <v-icon>mdi-google-drive</v-icon>
            <v-tooltip activator="parent" location="right">备份到 Google Drive</v-tooltip>
          </v-btn>
        </template>
      </v-list-item>

      <!-- 设置页面 -->
      <v-list-item prepend-icon="mdi-cog" title="设置" @click="$emit('show-settings')" />
      <v-divider class="my-2" />


      <v-list-item prepend-icon="mdi-plus" @click="$emit('create-conversation')">
        <template v-slot:title>
          <span class="text-truncate">新建对话</span>
        </template>
        <template v-slot:prepend>
          <v-icon>mdi-plus</v-icon>
          <v-tooltip activator="parent" location="right">新建对话</v-tooltip>
        </template>
      </v-list-item>

      <v-list-item v-for="conversation in conversations" :key="conversation.id"
        :active="currentConversationId === conversation.id" @click="$emit('set-conversation', conversation.id)">
        <template v-slot:prepend>
          <v-icon>mdi-chat</v-icon>
          <v-tooltip activator="parent" location="right">{{ conversation.title }}</v-tooltip>
        </template>
        <v-list-item-title class="text-truncate">{{ conversation.title }}</v-list-item-title>
        <template v-slot:append>
          <div class="chat-sidebar__conversation-actions">
            <v-btn icon size="small" variant="text" color="error" :disabled="conversations.length === 1"
              @click.stop="$emit('delete-conversation', conversation.id)">
              <v-icon>mdi-delete-outline</v-icon>
              <v-tooltip activator="parent" location="right">删除对话</v-tooltip>
            </v-btn>
          </div>
        </template>
      </v-list-item>
    </v-list>

    <!-- 提示消息 -->
    <v-snackbar v-model="showSnackbar" :color="snackbarColor" :timeout="3000">
      {{ snackbarText }}
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useUserStore } from '@/stores/user'
import { useDriveStore } from '@/stores/drive'

const props = defineProps({
  conversations: {
    type: Array,
    required: true
  },
  currentConversationId: {
    type: String,
    required: true
  }
})

const userStore = useUserStore()
const driveStore = useDriveStore()

const isUploadLoading = ref(false)
const showSnackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

defineEmits([
  'create-conversation',
  'set-conversation',
  'delete-conversation',
  'show-settings'
])

async function uploadGoogleDrive() {
  if (!userStore.isLoggedIn) {
    snackbarColor.value = 'error'
    snackbarText.value = '请先登录 Google 账号'
    showSnackbar.value = true
    return
  }
  isUploadLoading.value = true
  try {
    await driveStore.saveAllData()
    snackbarColor.value = 'success'
    snackbarText.value = '备份成功'
    showSnackbar.value = true
  } catch (error) {
    console.error('上传备份文件失败:', error)
    snackbarColor.value = 'error'
    snackbarText.value = '备份失败: ' + error.message
    showSnackbar.value = true
  } finally {
    isUploadLoading.value = false
  }
}
</script>

<style lang="scss">
.chat-sidebar {
  width: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  height: 100%;

  &__brand {
    padding: 12px 16px;

    .brand-icon {
      color: rgb(var(--v-theme-primary));
    }

    .brand-title {
      display: flex;
      align-items: center;
      gap: 4px;

      &__primary {
        font-size: 1.5rem;
        font-weight: 700;
        color: rgb(var(--v-theme-primary));
      }

      &__secondary {
        font-size: 1.5rem;
        font-weight: 300;
      }
    }
  }

  &__userInfo {
    .v-list-item-title {
      font-size: 1.2rem !important;
    }

    .v-list-item__prepend {
      margin-right: 18px !important;
    }
  }

  :deep(.v-list-item--active) {
    .v-icon {
      color: rgb(var(--v-theme-primary));
    }
  }

  &__conversation-actions {
    display: flex;
    align-items: center;
    gap: 4px;
    transition: opacity 0.2s ease;
  }
}

:root[data-theme='dark'] {
  .chat-sidebar {
    border-color: rgba(255, 255, 255, 0.12);
  }
}
</style>
