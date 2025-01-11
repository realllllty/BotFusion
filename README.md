# BotFusion2
![BotFusion2 Logo](https://pub-1fdea691c7ef4a9c895b88aeae4d1b68.r2.dev/chatbotfavicon.ico)

BotFusion2 是一个现代化的多机器人对话平台，支持同时与多个AI助手进行对话的Vue 3应用程序。

## 🌟 主要特性

- 💬 多机器人并行对话：同时与多个AI助手进行对话
- 🤖 灵活的机器人配置：支持自定义添加、编辑和删除机器人
- 🎨 深色/浅色主题切换：支持自动适配系统主题
- 📝 Markdown渲染：支持代码高亮显示
- 💾 会话管理：支持创建、切换和删除会话
- 🔧 可自定义API设置：支持配置不同的API端点和密钥

## 🛠️ 技术栈

- Vue 3 - 渐进式JavaScript框架
- Vuetify 3 - Material Design组件框架
- Vite - 现代前端构建工具
- Pinia - Vue状态管理
- Marked - Markdown渲染
- highlight.js - 代码语法高亮
- DOMPurify - XSS防护

## 🚀 快速开始

### 环境要求

- Node.js >= 16.0.0
- npm >= 7.0.0

### 安装

```bash
# 克隆项目
git clone [项目地址]

# 进入项目目录
cd vuetify-project

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 构建

```bash
# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

## 🔧 配置说明

### 机器人配置

1. 点击侧边栏的"添加机器人"
2. 填写以下信息：
   - 名称：机器人显示名称
   - Base URL：API基础地址
   - API Key：访问密钥
   - Model：模型名称（如：gpt-3.5-turbo）

## 📝 使用说明

1. **创建新对话**：点击侧边栏的"新建对话"按钮
2. **切换主题**：使用顶部的主题切换开关
3. **发送消息**：在底部输入框输入消息，点击发送按钮或按Enter键
4. **管理会话**：在侧边栏可以切换或删除会话
5. **复制消息**：点击消息下方的复制按钮可复制内容

## 🔐 安全说明

- API密钥等敏感信息仅存储在本地
- 使用DOMPurify进行XSS防护
- 所有API请求都经过安全验证

## 📄 许可证

[MIT License](LICENSE)
