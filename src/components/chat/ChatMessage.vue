<template>
  <div :class="['chat-message', `chat-message--${message.role}`]">
    <div class="chat-message__header">
      <v-avatar v-if="message.role === 'user' && userStore.user.photoURL" :image="userStore.user.photoURL" size="32" />
      <v-avatar v-else :color="message.role === 'user' ? 'primary-darken-1' : 'primary'"
        :variant="message.role === 'user' ? 'flat' : 'tonal'" size="32">
        <v-icon :icon="message.role === 'user' ? 'mdi-account' : 'mdi-robot'"
          :color="message.role === 'user' ? 'white' : 'primary'" size="16" />
      </v-avatar>
      <div class="chat-message__info">
        <span class="chat-message__name">{{ message.role === 'user' ? userName : botName }}</span>
        <span class="chat-message__time">{{ formatTime(message.timestamp) }}</span>
      </div>
    </div>

    <div :class="['chat-message__content', { 'chat-message__content--error': message.isError }]">
      <div
        :class="['chat-message__text', { 'markdown-body': message.role === 'assistant', 'chat-message__text--streaming': message.isStreaming }]"
        v-if="message.role === 'assistant'" v-html="renderMarkdown(message.content)" />
      <div v-else>{{ message.content }}</div>
      <div v-if="message.isStreaming" class="chat-message__streaming">
        <span class="chat-message__streaming-dot"></span>
        <span class="chat-message__streaming-dot"></span>
        <span class="chat-message__streaming-dot"></span>
      </div>
    </div>

    <div v-if="message.role === 'assistant'" class="chat-message__actions">
      <v-btn variant="text" density="comfortable" size="small" prepend-icon="mdi-content-copy"
        @click="copyMessage">复制</v-btn>
    </div>
  </div>
</template>
<script setup>
import { Marked } from 'marked'
import { markedHighlight } from 'marked-highlight'
import hljs from 'highlight.js'
import DOMPurify from 'dompurify'
import 'highlight.js/styles/github.css'
import { useUserStore } from '@/stores/user'
import { computed } from 'vue'

const userStore = useUserStore()

const props = defineProps({
  message: {
    type: Object,
    required: true
  },
  botName: {
    type: String,
    required: true
  }
})

// 计算用户名称
const userName = computed(() => userStore.user.name || '你')

// 计算用户头像
const userAvatar = computed(() => {
  if (userStore.user.photoURL) {
    return { src: userStore.user.photoURL }
  }
  return {
    color: 'primary-darken-1',
    icon: 'mdi-account'
  }
})

const marked = new Marked(
  markedHighlight({
    emptyLangClass: 'hljs',
    langPrefix: 'hljs language-',
    highlight(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext'
      return hljs.highlight(code, { language }).value
    }
  })
)

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString()
}

const renderMarkdown = (content) => {
  const html = marked.parse(content)
  return DOMPurify.sanitize(html)
}

const copyMessage = async () => {
  try {
    await navigator.clipboard.writeText(props.message.content)
  } catch (err) {
    console.error('复制失败:', err)
  }
}
</script>

<style lang="scss" scoped>
.chat-message {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px;
  transition: background-color 0.2s;
  border-radius: 8px;

  &:hover {
    background: rgba(var(--v-theme-surface-variant), 0.5);
  }

  &__header {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__info {
    display: flex;
    align-items: baseline;
    gap: 8px;
  }

  &__name {
    font-weight: 500;
    font-size: 0.875rem;
  }

  &__time {
    color: rgba(var(--v-theme-on-surface), 0.6);
    font-size: 0.75rem;
  }

  &__content {

    &--error {
      color: rgb(var(--v-theme-error));
    }
  }

  &__text {
    word-break: break-word;
    font-size: 0.9375rem;
    line-height: 1.5;

    &--streaming {
      opacity: 0.7;
    }

    &.markdown-body {
      :deep(p) {
        margin: 0.5em 0;
        line-height: 1.6;
      }

      :deep(h1),
      :deep(h2),
      :deep(h3),
      :deep(h4),
      :deep(h5),
      :deep(h6) {
        margin: 1em 0 0.5em;
        line-height: 1.4;
      }

      :deep(ul),
      :deep(ol) {
        margin: 0.5em 0;
        padding-left: 1.5em;

        li {
          margin: 0.3em 0;
        }
      }

      :deep(pre) {
        margin: 0.8em 0;
        padding: 1em;
        background: rgba(var(--v-theme-surface-variant), 0.5);
        border-radius: 8px;

        code {
          padding: 0;
          background: none;
        }
      }

      :deep(code) {
        padding: 0.2em 0.4em;
        background: rgba(var(--v-theme-surface-variant), 0.5);
        border-radius: 4px;
        font-size: 0.875em;
      }

      :deep(blockquote) {
        margin: 0.8em 0;
        padding: 0.5em 1em;
        border-left: 4px solid rgba(var(--v-theme-primary), 0.5);
        background: rgba(var(--v-theme-surface-variant), 0.3);
        border-radius: 4px;

        p {
          margin: 0;
        }
      }

      :deep(table) {
        margin: 0.8em 0;
        border-collapse: collapse;
        width: 100%;

        th,
        td {
          padding: 0.5em;
          border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
        }

        th {
          background: rgba(var(--v-theme-surface-variant), 0.5);
        }
      }
    }
  }

  &__streaming {
    display: flex;
    gap: 4px;
    margin-top: 8px;
    justify-content: flex-start;
    padding-left: 4px;
  }

  &__streaming-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
    animation: pulse 1.4s infinite;
    opacity: 0.5;

    &:nth-child(2) {
      animation-delay: 0.2s;
    }

    &:nth-child(3) {
      animation-delay: 0.4s;
    }
  }

  &__actions {}
}

@keyframes pulse {

  0%,
  100% {
    opacity: 0.5;
    transform: scale(1);
  }

  50% {
    opacity: 1;
    transform: scale(1.2);
  }
}
</style>
