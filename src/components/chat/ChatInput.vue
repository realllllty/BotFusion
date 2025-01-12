<template>
    <div class="chat-input">
        <div class="chat-input__container">
            <v-textarea
                v-model="message"
                placeholder="输入消息..."
                variant="outlined"
                density="comfortable"
                hide-details
                no-resize
                class="chat-input__textarea"
                @keydown.enter.prevent="sendMessage"
            />
            <v-btn
                color="primary"
                :loading="isLoading"
                :disabled="!message.trim()"
                elevation="1"
                @click="sendMessage"
                class="chat-input__send-btn"
                height="56"
            >
                <v-icon>mdi-send</v-icon>
            </v-btn>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
    isLoading: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['send'])

const message = ref('')

const sendMessage = () => {
    if (!message.value.trim() || props.isLoading) return
    emit('send', message.value)
    message.value = ''
}
</script>

<style lang="scss" scoped>
.chat-input {
    padding: 16px;
    width: 100%;

    &__container {
        display: flex;
        gap: 8px;
        align-items: flex-start;
        height: 100%;
    }

    &__textarea {
        flex: 1;
        background: rgb(var(--v-theme-surface));
        border-radius: 8px;
    }

    &__send-btn {
        flex-shrink: 0;
        align-self: stretch;
        height: 100% !important;
    }
}
</style>
