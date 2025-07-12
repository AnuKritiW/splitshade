<script setup lang="ts">
import { darkTheme } from 'naive-ui'
import { ref } from 'vue'
const code = ref(`// Write your WGSL code here`)

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
    // consoleOutput.value = "Compiled successfully, running shader..."
    consoleOutput.value = ""
    initWebGPU(canvasRef.value, code.value, (msg) => {
      consoleOutput.value += (msg || "Compiled successfully") + '\n'
    })
  }
}

const expandedNames = ref(['textures']) // default open

</script>

<template>
  <n-config-provider :theme="darkTheme">
    <div class="root-grid">
      <n-layout-header bordered style="padding: 12px;">
        <h2 style="margin: 0; color: white">SplitShade: WebGPU Playground</h2>
      </n-layout-header>

      <div class="grid-container">
        <!-- Editor (top-left) -->
        <n-card title="Editor" size="small" class="panel editor" style="grid-row: 1; grid-column: 1;">
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

        <!-- Preview (top-right) -->
        <n-card title="Preview" size="small" class="panel" style="grid-row: 1; grid-column: 2;">
          <canvas ref="canvasRef" id="gfx" style="width: 100%; height: 100%;"></canvas>
        </n-card>

        <!-- Textures (bottom-left) -->
        <n-card
          title="Resources"
          size="small"
          embedded
          class="resources-card"
        >
          <n-tabs type="segment" animated>
            <n-tab-pane name="textures" tab="Textures">
              <div class="texture-buttons">
                <n-button size="small" block>iChannel0</n-button>
                <n-button size="small" block>iChannel1</n-button>
                <n-button size="small" block>iChannel2</n-button>
                <n-button size="small" block>iChannel3</n-button>
              </div>
            </n-tab-pane>

            <n-tab-pane name="mesh" tab="Mesh">
              <!-- Empty for now -->
            </n-tab-pane>
          </n-tabs>
        </n-card>


        <!-- Console (bottom-right) -->
        <n-card title="Console" size="small" class="panel panel-console" style="grid-row: 2; grid-column: 2;">
          <div class="console-content">
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
}

/* Root grid with two rows: header + panels */
.root-grid {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
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
  height: 100%; /* fill the minmax row */
}

.panel {
  background-color: #1a1a1a;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.editor {
  grid-row: 1 / span 2; /* Span both rows */
}

.panel-console {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.panel-console .n-card__content {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.panel-console .console-content {
  flex: 1;
  overflow-y: auto;  /* scroll when it overflows */
  padding-bottom: 16px;
}

.texture-buttons {
  display: flex;
  flex-direction: row;
  gap: 8px;
  padding: 8px;
}

.texture-buttons .n-button {
  flex: 1;
  aspect-ratio: 1 / .4;        /* Makes them square */
  height: auto;               /* Let height be defined by width via aspect ratio */
  padding: 0;                 /* Optional: tighter padding */
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;         /* Smaller font if needed */
}

</style>
