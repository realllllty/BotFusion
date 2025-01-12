<!--
  首页组件
  功能：
  1. 展示应用程序的主页内容
  2. 提供基本的介绍和导航
-->
<template>
  <v-container class="home">
    <!-- 欢迎区域 -->
    <v-row class="home__hero" align="center" justify="center">
      <v-col cols="12" md="8" class="text-center">
        <h1 class="home__title text-h2 mb-6">
          欢迎使用 BotFusion
        </h1>
        <p class="home__subtitle text-h5 mb-8">
          多机器人协同对话平台
        </p>
        <v-btn color="primary" size="x-large" to="/chat" prepend-icon="mdi-chat">
          开始对话
        </v-btn>
      </v-col>
    </v-row>

    <!-- 功能特点 -->
    <v-row class="home__features mt-16">
      <v-col cols="12">
        <h2 class="text-h4 text-center mb-8">主要功能</h2>
      </v-col>

      <v-col cols="12" md="4">
        <v-card class="home__feature-card">
          <v-card-item>
            <template v-slot:prepend>
              <v-icon color="primary" size="large" icon="mdi-account-group" />
            </template>
            <v-card-title>多机器人协作</v-card-title>
            <v-card-text>
              支持多个AI助手同时对话，让不同模型相互配合，提供更全面的解答
            </v-card-text>
          </v-card-item>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card class="home__feature-card">
          <v-card-item>
            <template v-slot:prepend>
              <v-icon color="primary" size="large" icon="mdi-cog" />
            </template>
            <v-card-title>灵活配置</v-card-title>
            <v-card-text>
              可自定义配置每个机器人的模型、API和参数，满足不同场景需求
            </v-card-text>
          </v-card-item>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card class="home__feature-card">
          <v-card-item>
            <template v-slot:prepend>
              <v-icon color="primary" size="large" icon="mdi-message-text" />
            </template>
            <v-card-title>对话管理</v-card-title>
            <v-card-text>
              支持创建多个对话，方便管理不同主题的交流记录
            </v-card-text>
          </v-card-item>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
// 组件逻辑
</script>

<style lang="scss" scoped>
.home {
  &__hero {
    min-height: 60vh;
    display: flex;
    align-items: center;
  }

  &__title {
    font-weight: 700;
    background: linear-gradient(45deg, rgb(var(--v-theme-primary)) 30%, rgb(var(--v-theme-secondary)));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  &__subtitle {
    color: rgba(var(--v-theme-on-surface), 0.7);
  }

  &__features {
    padding: 2rem 0;
  }

  &__feature-card {
    height: 100%;
    transition: transform 0.3s ease;

    &:hover {
      transform: translateY(-4px);
    }
  }
}
</style>
