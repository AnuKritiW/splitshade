<script setup lang="ts">
import { darkTheme } from 'naive-ui'
import { ref, reactive, computed } from 'vue'
const code = ref(`// Write your WGSL code here`)

import { DEFAULT_TEXTURES } from './webgpu/textures'
import { initWebGPU } from './renderer'

import { VueMonacoEditor, loader } from '@guolao/vue-monaco-editor'
loader.config({
  paths: {
    vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs',
  },
})

const canvasRef = ref<HTMLCanvasElement | null>(null)
const consoleOutput = ref("")
const selectedTextures = reactive({
  iChannel0: null as string | null,
  iChannel1: null as string | null,
  iChannel2: null as string | null,
  iChannel3: null as string | null
})

selectedTextures.iChannel0 = DEFAULT_TEXTURES[0].path
selectedTextures.iChannel1 = DEFAULT_TEXTURES[1].path
selectedTextures.iChannel2 = DEFAULT_TEXTURES[2].path
selectedTextures.iChannel3 = DEFAULT_TEXTURES[3].path

function runShader() {
  if (!canvasRef.value || !selectedTextures) return;

  // consoleOutput.value = "Compiled successfully, running shader..."
  consoleOutput.value = ""
  initWebGPU(canvasRef.value, code.value, selectedTextures, (msg) => {
    consoleOutput.value += (msg || "Compiled successfully") + '\n'
  })
}


const showTextureModal = ref(false)
const activeChannel = ref('')
const availableTextures = ref<string[]>([])

function openTextureModal(channel: string) {
  activeChannel.value = channel
  showTextureModal.value = true
}

function selectTexture(img: string) {
  selectedTextures[activeChannel.value as keyof typeof selectedTextures] = img
  showTextureModal.value = false
}

function handleUpload({ file, onFinish }: any) {
  const reader = new FileReader()
  reader.onload = () => {
    const imgSrc = reader.result as string
    availableTextures.value.push(imgSrc)
    selectedTextures[activeChannel.value as keyof typeof selectedTextures] = imgSrc
    showTextureModal.value = false
    onFinish()
  }
  reader.readAsDataURL(file.file)
}

type ChannelKey = 'iChannel0' | 'iChannel1' | 'iChannel2' | 'iChannel3'
const channelList: ChannelKey[] = ['iChannel0', 'iChannel1', 'iChannel2', 'iChannel3']

const uploadedTextures = ref<string[]>([])

const allTextures = computed(() =>
  DEFAULT_TEXTURES.map(tex => tex.path).concat(uploadedTextures.value)
)

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
                <n-button
                  v-for="channel in channelList"
                  :key="channel"
                  size="small"
                  block
                  @click="openTextureModal(channel)"
                  class="n-button texture-button"
                >
                  <template #default>
                    <img
                      v-if="selectedTextures[channel]"
                      :src="selectedTextures[channel]"
                      :alt="channel"
                      class="button-bg"
                    />
                    <span class="button-label">{{ channel }}</span>
                  </template>
                </n-button>
              </div>
            </n-tab-pane>

            <n-tab-pane name="mesh" tab="Mesh">
              <!-- Empty for now -->
            </n-tab-pane>
          </n-tabs>
            <n-modal v-model:show="showTextureModal">
              <n-card title="Select or Upload Texture" style="width: 600px">
                <div class="thumbnail-grid" style="display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 16px;">
                  <n-image
                    v-for="(img, index) in allTextures"
                    :key="index"
                    :src="img"
                    width="80"
                    height="80"
                    style="cursor: pointer; border-radius: 4px"
                    @click="selectTexture(img)"
                    :preview-disabled="true"
                  />
                </div>

                <n-upload
                  accept="image/*"
                  :custom-request="handleUpload"
                  :show-file-list="false"
                >
                  <n-button block>Upload New Texture</n-button>
                </n-upload>
              </n-card>
            </n-modal>
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
