import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { v4 as uuidv4 } from 'uuid'

// 默认机器人配置
const DEFAULT_BOT = {
  id: 'default',
  name: 'ChatGPT',
  baseUrl: 'https://api.openai.com/v1',
  apiKey: '',
  model: 'gpt-3.5-turbo'
}

// 机器人管理 Store
export const useBotStore = defineStore('bot', () => {
  // 机器人配置列表
  const botConfigs = ref([DEFAULT_BOT])

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
  }

  // 更新机器人配置
  function updateBotConfig(botId, config) {
    const index = botConfigs.value.findIndex((bot) => bot.id === botId);
    if (index !== -1) {
      botConfigs.value[index] = { ...botConfigs.value[index], ...config };
    }
  }

  // 删除机器人配置
  function removeBot(botId) {
    // 不允许删除默认机器人
    if (botId === 'default') return;

    botConfigs.value = botConfigs.value.filter((bot) => bot.id !== botId);
    activeBots.value = activeBots.value.filter((id) => id !== botId);
  }

  // 切换机器人的激活状态
  function toggleBotActive(botId, active) {
    if (active && !activeBots.value.includes(botId)) {
      activeBots.value.push(botId);
    } else if (!active) {
      activeBots.value = activeBots.value.filter((id) => id !== botId);
    }
  }

  // 重置所有机器人配置到初始状态
  function resetBots() {
    console.log('first');
    botConfigs.value = [DEFAULT_BOT];
    activeBots.value = ['default'];
  }

  return {
    botConfigs,
    activeBots,
    getBotConfig,
    addBot,
    updateBotConfig,
    removeBot,
    toggleBotActive,
    resetBots
  }
}, {
  persist: true
})
