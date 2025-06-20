<script setup lang="ts">
import { darkTheme } from 'naive-ui'
import { ref } from 'vue'
import { VueMonacoEditor } from '@guolao/vue-monaco-editor'
const code = ref(`// Write your WGSL code here`)
</script>

<template>
  <n-config-provider :theme="darkTheme">
    <n-layout style="height: 100vh">
      <n-layout-header bordered style="padding: 12px;">
        <h2 style="margin: 0; color: white">SplitShade: WebGPU Playground</h2>
      </n-layout-header>

      <div class="grid-container">
        <n-card title="Editor" size="small" class="panel editor">
          <VueMonacoEditor
            language="wgsl"
            theme="vs-dark"
            v-model="code"
            height="100%"
          />
        </n-card>

        <n-card title="Preview" size="small" class="panel">
          <canvas id="gfx" style="width: 100%; height: 100%;"></canvas>
        </n-card>

        <n-card title="Console" size="small" class="panel">
          Console output
        </n-card>
      </div>
    </n-layout>
  </n-config-provider>
</template>


<style>
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  overflow: hidden;
}

.grid-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  height: 100%;
  gap: 12px;
  padding: 12px;
  background-color: #101014;
  box-sizing: border-box;
}

.panel {
  background-color: #1a1a1a;
  overflow: hidden;
}

.editor {
  grid-row: 1 / span 2; /* Span both rows */
}

</style>
