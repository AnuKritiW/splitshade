import { createApp } from 'vue'
import App from './App.vue'
import naive from 'naive-ui'
import '@fontsource/lato/400.css'
import { install as VueMonacoEditorPlugin } from '@guolao/vue-monaco-editor'

const app = createApp(App)
app.use(naive)
app.use(VueMonacoEditorPlugin, {
    paths: {
      // You can change the CDN config to load other versions
      vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs'
    },
  })
app.mount('#app')
