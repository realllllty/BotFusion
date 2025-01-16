<template>
  <v-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" width="500">
    <v-card>
      <v-card-title class="text-h5">
        设置
      </v-card-title>

      <v-card-text>
        <!-- Google设置 -->
        <template v-if="userStore.isLoggedIn">
          <v-list>
            <v-list-item>
              <template v-slot:prepend>
                <v-avatar :image="userStore.user.photoURL" size="40" />
              </template>
              <v-list-item-title>{{ userStore.user.name }}</v-list-item-title>
              <v-list-item-subtitle>{{ userStore.user.email }}</v-list-item-subtitle>
              <template v-slot:append>
                <v-btn color="error" variant="text" prepend-icon="mdi-logout" @click="handleLogout">
                  退出登录
                </v-btn>
              </template>
            </v-list-item>

            <!-- Google Drive 备份 -->
            <v-list-item>
              <v-list-item-title>Google Drive 备份</v-list-item-title>
              <template v-slot:append>
                <div class="d-flex gap-2">
                  <v-btn color="primary" variant="text" :loading="isBackupLoading" @click="handleBackup">
                    备份对话
                  </v-btn>
                  <v-btn color="warning" variant="text" :loading="isRestoreLoading" @click="handleRestore">
                    恢复对话
                  </v-btn>
                </div>
              </template>
            </v-list-item>
          </v-list>
        </template>
        <template v-else>
          <v-btn color="primary" prepend-icon="mdi-google" @click="handleGoogleLogin" :loading="isLoading">
            使用 Google 账号登录
          </v-btn>
        </template>

        <v-list>
          <!-- 主题设置 -->
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
              <div class="settings-dialog__bot-actions">
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
        </v-list>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="primary" variant="text" @click="$emit('update:modelValue', false)">
          关闭
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- 添加 Snackbar -->
  <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000">
    {{ snackbar.text }}
  </v-snackbar>
</template>

<script setup>
import { ref, defineProps, defineEmits } from 'vue'
import { useTheme } from 'vuetify'
import { useUserStore } from '@/stores/user'
import { useDriveStore } from '@/stores/drive'
import { useChatStore } from '@/stores/chat'
import { useBotStore } from '@/stores/bot'
import { googleLogout, googleTokenLogin } from "vue3-google-login"

const theme = useTheme();
const userStore = useUserStore();
const driveStore = useDriveStore();
const botStore = useBotStore();
const chatStore = useChatStore();
const isLoading = ref(false);
const isBackupLoading = ref(false);
const isRestoreLoading = ref(false);

const snackbar = ref({
  show: false,
  text: '',
  color: 'success'
})

defineProps({
  modelValue: {
    type: Boolean,
    default: false,
    required: true
  },
  botConfigs: {
    type: Array,
    required: true
  }
})

defineEmits([
  'update:modelValue',
  'show-bot-dialog',
  'edit-bot',
  'remove-bot'
])

// Google 登录处理
async function handleGoogleLogin() {
  try {
    isLoading.value = true
    const response = await googleTokenLogin()
    console.log("Token Response:", response)

    // 保存用户信息到 store
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        'Authorization': `Bearer ${response.access_token}`
      }
    })
    const userData = await userInfoResponse.json()

    userStore.setUser({
      uid: userData.sub,
      displayName: userData.name,
      email: userData.email,
      photoURL: userData.picture,
      accessToken: response.access_token
    })

  } catch (error) {
    console.error('Google登录失败:', error)
  } finally {
    isLoading.value = false
  }
}

// 备份对话到 Google Drive
async function handleBackup() {
  try {
    isBackupLoading.value = true
    await driveStore.saveAllData()
    snackbar.value = {
      show: true,
      text: '备份成功',
      color: 'success'
    }
  } catch (error) {
    console.error('备份失败:', error)
    snackbar.value = {
      show: true,
      text: '备份失败: ' + error.message,
      color: 'error'
    }
  } finally {
    isBackupLoading.value = false
  }
}

// 从 Google Drive 恢复对话
async function handleRestore() {
  if (!confirm('确定要恢复数据吗？这将覆盖当前所有对话记录和机器人配置！')) {
    return;
  }

  try {
    isRestoreLoading.value = true;
    const data = await driveStore.loadAllData();

    // 更新对话记录和机器人配置
    chatStore.$patch({
      conversations: data.conversations,
      messages: data.messages
    })

    // 更新机器人配置
    botStore.$patch({
      botConfigs: data.botConfigs,
      activeBots: data.activeBots
    })

    snackbar.value = {
      show: true,
      text: '恢复成功',
      color: 'success'
    }
  } catch (error) {
    console.error('恢复失败:', error)
    snackbar.value = {
      show: true,
      text: '恢复失败: ' + error.message,
      color: 'error'
    }
  } finally {
    isRestoreLoading.value = false
  }
}

// 退出登录
const handleLogout = () => {
  // 清除用户信息
  userStore.clearUser();

  // 清除机器人配置
  botStore.resetBots();
  // 清除对话记录
  chatStore.resetChats();

  // 调用Google登出
  googleLogout();

  // 刷新页面
  location.reload();
}
</script>

<style lang="scss" scoped>
.settings-dialog__bot-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

:deep(.v-list:nth-child(2)) {
  margin-top: 20px;
}
</style>
