<template>
    <div class="chat-area">
        <div class="chat-area__columns">
            <template v-for="botId in activeBots" :key="botId">
                <!-- 单个机器人的聊天列 -->
                <div
                    class="chat-area__column"
                    :style="{
                        width:
                            columnWidths[botId] || `${100 / activeBots.length}%`
                    }"
                >
                    <!-- 顶部工具栏 -->
                    <v-toolbar
                        density="comfortable"
                        color="surface"
                        elevation="1"
                        rounded="lg"
                        class="mb-2"
                    >
                        <v-toolbar-title>{{
                            getBotName(botId)
                        }}</v-toolbar-title>
                        <v-spacer />
                    </v-toolbar>

                    <!-- 消息列表 -->
                    <div
                        class="chat-area__messages"
                        :ref="
                            (el) => {
                                if (el) messageContainers[botId] = el
                            }
                        "
                    >
                        <ChatMessage
                            v-for="message in getBotMessages(botId)"
                            :key="message.id"
                            :message="message"
                            :bot-name="getBotName(botId)"
                        />
                    </div>
                </div>

                <!-- 列分隔符 -->
                <div
                    v-if="botId !== activeBots[activeBots.length - 1]"
                    class="chat-area__column-resizer"
                    @mousedown="startResize($event, botId)"
                />
            </template>
        </div>
    </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import ChatMessage from './ChatMessage.vue'

const props = defineProps({
    activeBots: {
        type: Array,
        required: true
    },
    columnWidths: {
        type: Object,
        required: true
    },
    getBotName: {
        type: Function,
        required: true
    },
    getBotMessages: {
        type: Function,
        required: true
    }
})

const emit = defineEmits(['update:columnWidths'])

// 列宽调整
let resizingColumn = null
const messageContainers = ref({})

const startResize = (event, botId) => {
    resizingColumn = botId
    document.addEventListener('mousemove', handleResize)
    document.addEventListener('mouseup', stopResize)
}

const handleResize = (event) => {
    if (!resizingColumn) return

    const container = event.target.closest('.chat-area__column')
    if (!container) return

    const newWidth = event.clientX - container.getBoundingClientRect().left
    emit('update:columnWidths', {
        ...props.columnWidths,
        [resizingColumn]: `${newWidth}px`
    })
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
</script>

<style lang="scss" scoped>
.chat-area {
    display: flex;
    flex-direction: column;
    height: 100%;

    &__columns {
        display: flex;
        height: 100%;
        overflow: hidden;
        padding: 16px;
        gap: 16px;
    }

    &__column {
        display: flex;
        flex-direction: column;
        min-width: 300px;
        height: 100%;
    }

    &__column-resizer {
        width: 4px;
        background: rgba(0, 0, 0, 0.12);
        cursor: col-resize;
        transition: background-color 0.2s;

        &:hover {
            background: rgba(0, 0, 0, 0.24);
        }
    }

    &__messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 16px;
    }
}

:root[data-theme='dark'] {
    .chat-area {
        &__column-resizer {
            background: rgba(255, 255, 255, 0.12);

            &:hover {
                background: rgba(255, 255, 255, 0.24);
            }
        }
    }
}
</style>
