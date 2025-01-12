import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { v4 as uuidv4 } from 'uuid'

// 机器人管理 Store
export const useBotStore = defineStore('bot', () => {
    // 机器人配置列表
    const botConfigs = ref([
        // 默认机器人配置
        {
            id: 'default',
            name: 'ChatGPT',
            baseUrl: 'https://api.openai.com/v1',
            apiKey: '',
            model: 'gpt-3.5-turbo'
        }
    ])

    // 当前激活的机器人ID列表
    const activeBots = ref(['default'])

    // 获取指定ID的机器人配置
    const getBotConfig = computed(() => (botId) => {
        return botConfigs.value.find((bot) => bot.id === botId)
    })

    // 添加新的机器人配置
    function addBot(config) {
        const newBot = {
            id: uuidv4(),
            ...config
        }
        botConfigs.value.push(newBot)
        activeBots.value.push(newBot.id)
        saveToLocalStorage()
    }

    // 更新机器人配置
    function updateBotConfig(botId, config) {
        const index = botConfigs.value.findIndex((bot) => bot.id === botId)
        if (index !== -1) {
            botConfigs.value[index] = { ...botConfigs.value[index], ...config }
            saveToLocalStorage()
        }
    }

    // 删除机器人配置
    function removeBot(botId) {
        // 不允许删除默认机器人
        if (botId === 'default') return

        botConfigs.value = botConfigs.value.filter((bot) => bot.id !== botId)
        activeBots.value = activeBots.value.filter((id) => id !== botId)
        saveToLocalStorage()
    }

    // 切换机器人的激活状态
    function toggleBotActive(botId, active) {
        if (active && !activeBots.value.includes(botId)) {
            activeBots.value.push(botId)
        } else if (!active) {
            activeBots.value = activeBots.value.filter((id) => id !== botId)
        }
        saveToLocalStorage()
    }

    // 将配置保存到本地存储
    function saveToLocalStorage() {
        localStorage.setItem('botConfigs', JSON.stringify(botConfigs.value))
        localStorage.setItem('activeBots', JSON.stringify(activeBots.value))
    }

    // 从本地存储加载配置
    function loadFromLocalStorage() {
        const savedBotConfigs = localStorage.getItem('botConfigs')
        const savedActiveBots = localStorage.getItem('activeBots')

        if (savedBotConfigs) {
            botConfigs.value = JSON.parse(savedBotConfigs)
        }
        if (savedActiveBots) {
            activeBots.value = JSON.parse(savedActiveBots)
        }
    }

    return {
        botConfigs,
        activeBots,
        getBotConfig,
        addBot,
        updateBotConfig,
        removeBot,
        toggleBotActive,
        saveToLocalStorage,
        loadFromLocalStorage
    }
})
