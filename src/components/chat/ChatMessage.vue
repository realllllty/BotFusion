<template>
    <div :class="['chat-message', `chat-message--${message.role}`]">
        <v-card
            :class="[
                'chat-message__card',
                { 'chat-message__card--error': message.isError }
            ]"
            :color="message.role === 'user' ? 'primary' : 'surface'"
            :variant="message.role === 'user' ? 'flat' : 'elevated'"
            elevation="1"
        >
            <!-- 消息头部 -->
            <v-card-item class="chat-message__header">
                <template v-slot:prepend>
                    <v-avatar
                        :color="
                            message.role === 'user'
                                ? 'primary-darken-1'
                                : 'primary'
                        "
                        :variant="message.role === 'user' ? 'flat' : 'tonal'"
                    >
                        <v-icon
                            :icon="
                                message.role === 'user'
                                    ? 'mdi-account'
                                    : 'mdi-robot'
                            "
                            :color="
                                message.role === 'user' ? 'white' : 'primary'
                            "
                        />
                    </v-avatar>
                </template>
                <v-card-title class="text-subtitle-2">
                    {{ message.role === 'user' ? '你' : botName }}
                </v-card-title>
                <v-card-subtitle class="text-caption">
                    {{ formatTime(message.timestamp) }}
                </v-card-subtitle>
            </v-card-item>

            <!-- 消息内容 -->
            <v-card-text
                :class="[
                    'chat-message__content',
                    { 'chat-message__content--user': message.role === 'user' }
                ]"
            >
                <div
                    :class="[
                        'chat-message__text',
                        {
                            'markdown-body': message.role === 'assistant',
                            'chat-message__text--streaming': message.isStreaming
                        }
                    ]"
                    v-if="message.role === 'assistant'"
                    v-html="renderMarkdown(message.content)"
                />
                <div v-else>{{ message.content }}</div>
                <div v-if="message.isStreaming" class="chat-message__streaming">
                    <span class="chat-message__streaming-dot"></span>
                    <span class="chat-message__streaming-dot"></span>
                    <span class="chat-message__streaming-dot"></span>
                </div>
            </v-card-text>

            <!-- 消息操作按钮 -->
            <v-card-actions
                v-if="message.role === 'assistant'"
                class="chat-message__actions"
            >
                <v-spacer />
                <v-btn
                    variant="text"
                    density="comfortable"
                    prepend-icon="mdi-content-copy"
                    @click="copyMessage"
                >
                    复制
                </v-btn>
            </v-card-actions>
        </v-card>
    </div>
</template>

<script setup>
import { Marked } from 'marked'
import { markedHighlight } from 'marked-highlight'
import hljs from 'highlight.js'
import DOMPurify from 'dompurify'

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
    max-width: 100%;

    &--user {
        align-self: flex-end;
    }

    &--assistant {
        align-self: flex-start;
    }

    &__card {
        max-width: 100%;

        &--error {
            border: 1px solid rgb(var(--v-theme-error));
        }
    }

    &__header {
        padding: 8px 16px;
    }

    &__content {
        padding: 16px;

        &--user {
            color: white;
        }
    }

    &__text {
        word-break: break-word;

        &--streaming {
            opacity: 0.7;
        }
    }

    &__streaming {
        display: flex;
        gap: 4px;
        margin-top: 8px;
        justify-content: center;
    }

    &__streaming-dot {
        width: 8px;
        height: 8px;
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
