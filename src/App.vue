<script setup lang="ts">
import { darkTheme } from 'naive-ui'
import { ref } from 'vue'
const code = ref(`// Write your WGSL code here`)

import { onMounted } from 'vue'
import { initWebGPU } from './renderer'

import { VueMonacoEditor, loader } from '@guolao/vue-monaco-editor'
loader.config({
  paths: {
    vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs',
  },
})

const canvasRef = ref<HTMLCanvasElement | null>(null)
const consoleOutput = ref("")
function runShader() {
  if (canvasRef.value) {
    consoleOutput.value = "Compiled successfully, running shader..."
    initWebGPU(canvasRef.value, code.value, (msg) => {
      consoleOutput.value = msg || "Compiled successfully"
    })
  }
}

</script>

<template>
  <n-config-provider :theme="darkTheme">
    <div class="root-grid">
      <n-layout-header bordered style="padding: 12px;">
        <h2 style="margin: 0; color: white">SplitShade: WebGPU Playground</h2>
      </n-layout-header>

      <div class="grid-container">
        <n-card title="Editor" size="small" class="panel editor">
          <VueMonacoEditor
            language="wgsl"
            theme="vs-dark"
            v-model:value="code"
            style="height: 100%; width: 100%;"
          />
          <template #footer>
            <n-button @click="runShader" block>Run Shader</n-button>
          </template>
        </n-card>

        <n-card title="Preview" size="small" class="panel">
          <canvas ref="canvasRef" id="gfx" style="width: 100%; height: 100%;"></canvas>
        </n-card>

        <n-card title="Console" size="small" class="panel">
          <div style="height: 100%; overflow-y: auto; white-space: pre-wrap; color: #ccc; font-family: monospace; padding: 8px;">
            {{ consoleOutput }}
          </div>
        </n-card>

      </div>
    </div>
  </n-config-provider>
</template>

<style>
html, body, #app, .n-layout {
  margin: 0;
  padding: 0;
  height: 100%;
  overflow: hidden;
}

/* Root grid with two rows: header + panels */
.root-grid {
  display: grid;
  grid-template-rows: auto 1fr;
  height: 100vh;
}

.grid-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 3fr 1fr;
  gap: 12px;
  padding: 12px;
  background-color: #101014;
  box-sizing: border-box;
}

.panel {
  background-color: #1a1a1a;
  height: 100%;
  overflow: hidden;
}

.editor {
  grid-row: 1 / span 2; /* Span both rows */
}

</style>
