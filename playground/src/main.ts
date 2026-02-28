import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import '@dragcraft/themes/antd'
import './styles/playground.css'

createApp(App).use(router).mount('#app')
