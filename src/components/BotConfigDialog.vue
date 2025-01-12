<!--
  机器人配置对话框组件
  功能：
  1. 新增/编辑机器人配置
  2. 表单验证
  3. 支持双向绑定显示状态

  设计思路：
  1. 使用 v-dialog 作为对话框容器
  2. 通过 props 接收显示状态和编辑对象
  3. 使用 computed 计算当前模式（新增/编辑）
  4. 使用 watch 监听编辑对象变化并更新表单
  5. 使用 emit 发送更新事件
-->
<template>
  <!--
    对话框组件
    :model-value - 控制对话框显示状态（替代 v-model 以避免直接修改 props）
    @update:model-value - 监听状态变化并通知父组件
  -->
  <v-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" width="500">
    <v-card>
      <!-- 标题区域：根据编辑状态显示不同文本 -->
      <v-card-title>{{ isEditing ? '编辑机器人' : '添加机器人' }}</v-card-title>

      <!-- 表单区域 -->
      <v-card-text>
        <!-- 机器人名称：必填字段 -->
        <v-text-field v-model="form.name" label="名称" required />
        <!-- API 基础地址：可选，提供默认值 -->
        <v-text-field v-model="form.baseUrl" label="Base URL" placeholder="https://api.openai.com/v1" />
        <!-- API 密钥：必填，使用 password 类型保护隐私 -->
        <v-text-field v-model="form.apiKey" label="API Key" type="password" />
        <!-- 模型名称：必填 -->
        <v-text-field v-model="form.model" label="Model Name" placeholder="gpt-3.5-turbo" />
      </v-card-text>

      <!-- 操作按钮区域 -->
      <v-card-actions>
        <v-spacer />
        <v-btn color="primary" @click="save">
          保存
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch, computed } from 'vue'

// 组件属性定义
const props = defineProps({
  // 对话框显示状态
  modelValue: {
    type: Boolean,
    required: true
  },
  // 当前编辑的机器人配置，为 null 时表示新增模式
  editingBot: {
    type: Object,
    default: null
  }
})

// 定义组件可触发的事件
const emit = defineEmits([
  'update:modelValue', // 更新显示状态
  'save'              // 保存配置
])

// 计算属性：判断当前是否为编辑模式
const isEditing = computed(() => !!props.editingBot)

// 表单数据，使用响应式引用
const form = ref({
  name: '',
  baseUrl: 'https://api.openai.com/v1', // 默认 API 地址
  apiKey: '',
  model: 'gpt-3.5-turbo'               // 默认模型
})

// 监听编辑对象变化，同步更新表单数据
watch(() => props.editingBot, (newVal) => {
  if (newVal) {
    // 编辑模式：复制现有配置到表单
    form.value = { ...newVal }
  } else {
    // 新增模式：重置表单到默认值
    form.value = {
      name: '',
      baseUrl: 'https://api.openai.com/v1',
      apiKey: '',
      model: 'gpt-3.5-turbo'
    }
  }
}, { immediate: true }) // immediate: true 确保组件初始化时执行一次

/**
 * 保存配置
 * 1. 执行表单验证
 * 2. 清理表单数据（去除首尾空格）
 * 3. 发送保存事件
 * 4. 关闭对话框
 */
const save = () => {
  // 表单验证
  if (!form.value.name?.trim()) {
    alert('请输入机器人名称')
    return
  }
  if (!form.value.apiKey?.trim()) {
    alert('请输入API Key')
    return
  }
  if (!form.value.model?.trim()) {
    alert('请输入模型名称')
    return
  }

  // 构建配置对象，清理数据
  const config = {
    name: form.value.name.trim(),
    baseUrl: form.value.baseUrl.trim() || 'https://api.openai.com/v1', // 使用默认值
    apiKey: form.value.apiKey.trim(),
    model: form.value.model.trim()
  }

  // 发送保存事件
  emit('save', config)
  // 关闭对话框
  emit('update:modelValue', false)
}
</script>
