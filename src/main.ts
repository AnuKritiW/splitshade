import { createApp } from 'vue'
import App from './App.vue'
import naive from 'naive-ui'
import '@fontsource/lato/400.css'

createApp(App)
  .use(naive)
  .mount('#app')
