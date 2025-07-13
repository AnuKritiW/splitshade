<!-- /** 
This is the split layout thats been stashed in case it needs to be revisited
*/
<template>
  <n-config-provider :theme="darkTheme" :theme-overrides="themeOverrides">
    <div class="root">
      <n-layout-header bordered class="header">
        <h2>SplitShade: WebGPU Playground</h2>
      </n-layout-header>

      <div class="main">
        <n-split direction="horizontal" style="height: 100%;" :min="0.2" :max="0.6">

          <template #1>
            <n-split direction="vertical" style="height: 100%;" :default-size="0.75" :min="0.75" :max="1.0">
              <template #1>
                <n-card title="Editor" size="small" class="panel">
                  <VueMonacoEditor
                      language="wgsl"
                      theme="vs-dark"
                      v-model:value="code"
                      style="height: 100%; width: 100%"
                      :options="{ automaticLayout: true }"
                  />
                  <template #footer>
                      <n-button @click="runShader" block>Run Shader</n-button>
                  </template>
                </n-card>
              </template>

              <template #2>
                <n-card title="Textures" size="small" class="panel textures-panel">
                  <div class="texture-buttons">
                    <n-button size="small">iChannel0</n-button>
                    <n-button size="small">iChannel1</n-button>
                    <n-button size="small">iChannel2</n-button>
                    <n-button size="small">iChannel3</n-button>
                  </div>
                </n-card>
              </template>
            </n-split>
          </template>

          <template #2>
            <n-split direction="vertical" style="height: 100%;" :default-size="0.75" :min="0.75" :max="1.0">

              <template #1>
                <n-card title="Preview" size="small" class="panel">
                  <canvas ref="canvasRef" id="gfx" style="width: 100%; height: 100%;"></canvas>
                </n-card>
              </template>

              <template #2>
                <n-card title="Console" size="small" class="panel">
                  <div class="console-content">{{ consoleOutput }}</div>
                </n-card>
              </template>

            </n-split>
          </template>

        </n-split>
      </div>
    </div>
  </n-config-provider>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { darkTheme, type GlobalThemeOverrides } from 'naive-ui'
import { VueMonacoEditor, loader } from '@guolao/vue-monaco-editor'
import { initWebGPU } from './renderer'

const code = ref(`// Write your WGSL code here`)
const consoleOutput = ref("")
const canvasRef = ref<HTMLCanvasElement | null>(null)

const themeOverrides: GlobalThemeOverrides = {
  common: {
    dividerColor: '#444'
  },
  Split: {
    dividerColor: '#444'
  }
}

loader.config({
  paths: {
    vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs',
  },
})

function runShader() {
  if (canvasRef.value) {
    consoleOutput.value = ""
    initWebGPU(canvasRef.value, code.value, (msg) => {
      consoleOutput.value += (msg || "Compiled successfully") + '\n'
    })
  }
}
</script>

<style>
html, body, #app {
  height: 100%;
  margin: 0;
  padding: 0;
}

.root {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.header {
  height: 60px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  color: white;
}

.main {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.panel {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.console-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.monaco-editor {
  position: absolute !important;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.texture-buttons {
  display: flex;
  flex-direction: row;
  gap: 8px;
  padding: 8px;
}

.texture-buttons .n-button {
  flex: 1;
  aspect-ratio: 1 / .6;        /* Makes them square */
  height: auto;               /* Let height be defined by width via aspect ratio */
  padding: 0;                 /* Optional: tighter padding */
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;         /* Smaller font if needed */
}

/* TODO: handle the white dots at the corners */
.n-split__resize-trigger {
  --n-resize-trigger-color: #444;
}

</style> -->
