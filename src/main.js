// Plugins
import { registerPlugins } from '@/plugins'
import App from './App.vue'
import { createApp } from 'vue'
import vue3GoogleLogin from 'vue3-google-login'

const app = createApp(App)
registerPlugins(app)

app.use(vue3GoogleLogin, {
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID
})

app.mount('#app')
