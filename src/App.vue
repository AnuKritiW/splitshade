<script setup lang="ts">
import { darkTheme } from 'naive-ui'
import { ref, reactive, computed, h } from 'vue'
const code = ref(`// Write your WGSL code here`)

import { DEFAULT_TEXTURES } from './webgpu/textures'
import { initWebGPU } from './webgpu/renderer'
import { parseObjToVertices } from './utils/objParser'

import { VueMonacoEditor, loader } from '@guolao/vue-monaco-editor'
import { NIcon } from 'naive-ui'
import { ClipboardOutline, DownloadOutline } from '@vicons/ionicons5'

import ConsolePanel from './components/ConsolePanel.vue'
import PreviewPanel from './components/PreviewPanel.vue'
import EditorPanel from './components/EditorPanel.vue'
import { useTextures } from './composables/useTextures'
import { useMesh } from './composables/useMesh'
import ResourcesPanel from './components/ResourcesPanel.vue'

const {
  selectedTextures,
  allTextures,
  showTextureModal,
  openTextureModal,
  selectTexture,
  handleUpload
} = useTextures()

const {
  showMeshModal,
  uploadedMesh,
  presetMeshes,
  openMeshModal,
  removeMesh,
  copyStarterCode,
  handleMeshUpload,
  selectPresetMesh,
  downloadMesh
} = useMesh()

loader.config({
  paths: {
    vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs',
  },
})

// const canvasRef = ref<HTMLCanvasElement | null>(null)
const previewRef = ref<InstanceType<typeof PreviewPanel> | null>(null)
const consoleOutput = ref("")

function runShader() {
  if (!previewRef.value?.canvasRef || !selectedTextures) return;

  // consoleOutput.value = "Compiled successfully, running shader..."
  consoleOutput.value = ""
  initWebGPU(
    previewRef.value.canvasRef,
    code.value,
    selectedTextures.value,
    (msg) => {
      consoleOutput.value += (msg || "Compiled successfully") + '\n'
    },
    uploadedMesh.vertexData // vertex buffer or null
  )
}

type ChannelKey = 'iChannel0' | 'iChannel1' | 'iChannel2' | 'iChannel3'
const channelList: ChannelKey[] = ['iChannel0', 'iChannel1', 'iChannel2', 'iChannel3']

function renderClipboardIcon() {
  return h(NIcon, null, {
    default: () => h(ClipboardOutline)
  })
}

</script>

<template>
  <n-config-provider :theme="darkTheme">
    <div class="root-grid">
      <n-layout-header bordered style="padding: 12px;">
        <h2 style="margin: 0; color: white">SplitShade: WebGPU Playground</h2>
      </n-layout-header>

      <div class="grid-container">
        <!-- Editor (top-left) -->
        <EditorPanel v-model:code="code" :runShader="runShader" />

        <!-- Preview (top-right) -->
         <PreviewPanel ref="previewRef" style="grid-row: 1; grid-column: 2;" />

        <!-- Resources (bottom-left) -->
        <ResourcesPanel
          :selectedTextures="selectedTextures"
          :allTextures="allTextures"
          :showTextureModal="showTextureModal"
          :showMeshModal="showMeshModal"
          :presetMeshes="presetMeshes"
          :uploadedMesh="uploadedMesh"
          @openTextureModal="openTextureModal"
          @openMeshModal="openMeshModal"
          @removeMesh="removeMesh"
          @copyStarterCode="copyStarterCode"
          @selectTexture="selectTexture"
          @handleTextureUpload="handleUpload"
          @selectPresetMesh="selectPresetMesh"
          @downloadMesh="downloadMesh"
          @handleMeshUpload="handleMeshUpload"
          @update:showTextureModal="val => showTextureModal = val"
          @update:showMeshModal="val => showMeshModal = val"
        />

        <!-- Console (bottom-right) -->
        <ConsolePanel
          :console-output="consoleOutput"
          style="grid-row: 2; grid-column: 2;"
        />

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

/* Container for texture buttons inside 'Textures' tab */
.texture-buttons {
  display: flex;
  flex-direction: row;
  gap: 8px;
  padding: 8px;
}

/* Base button layout: sizing and appearance */
.texture-buttons .n-button {
  flex: 1;
  aspect-ratio: 1 / .4;       /* Makes them square */
  height: auto;               /* Let height be defined by width via aspect ratio */
  padding: 0;                 /* Removes inner padding for tighter fit */
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;         /* Smaller font for labels */
}

/* Individual texture button: enables layered image + label */
.texture-button {
  position: relative;
  overflow: hidden;
}

/* Background thumbnail image (stretched to fill button) */
.texture-button .button-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;          /* Preserves aspect ratio, fills area */
  z-index: 0;
  opacity: 0.6;               /* Faint background behind label */
}

/* Overlay label for each channel (e.g., 'iChannel0') */
.texture-button .button-label {
  position: relative;
  z-index: 1;
  color: white;
  font-weight: bold;
}

</style>
