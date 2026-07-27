import { createApp } from 'vue'
import App from './App.vue'
// #region tutorial-workbench-styles
import 'ant-design-vue/dist/reset.css'
import '@dragcraft/themes'
// #endregion tutorial-workbench-styles
import '@dragcraft/device-frames/styles'
import './styles.css'

createApp(App).mount('#app')
