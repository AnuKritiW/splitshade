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
  initWebGPU(
    canvasRef.value,
    code.value,
    selectedTextures,
    (msg) => {
      consoleOutput.value += (msg || "Compiled successfully") + '\n'
    },
    uploadedMesh.vertexData // vertex buffer or null
  )
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

const uploadedMesh = reactive({
  name: '',
  content: '',                            // raw .obj text
  vertexData: null as Float32Array | null // parsed vertex buffer
})

function handleMeshUpload({ file, onFinish }: any) {
  const reader = new FileReader()
  reader.onload = () => {
    const objText = reader.result as string
    uploadedMesh.name = file.name
    uploadedMesh.content = objText
    try {
      uploadedMesh.vertexData = parseObjToVertices(objText)
      console.log("Parsed vertex count:", uploadedMesh.vertexData.length / 6)
    } catch (e) {
      console.error("OBJ parsing failed:", e)
    }
    onFinish()
    console.log("Loaded OBJ content:", uploadedMesh.content.slice(0, 200), "...")
  }
  reader.readAsText(file.file)
}

function copyStarterCode() {
  const defaultCode = `
// Default shader code for uploaded mesh
struct VertexOut {
  @builtin(position) position: vec4<f32>,
  @location(0) color: vec3<f32>,
};

@vertex
fn main(@location(0) pos: vec3<f32>, @location(1) color: vec3<f32>) -> VertexOut {
  var out: VertexOut;
  // Adjust as needed to ensure the object is in clip space and in front of the camera
  out.position = vec4<f32>(pos, 1.0);
  out.color = color;
  return out;
}

@fragment
fn main_fs(@location(0) color: vec3<f32>) -> @location(0) vec4<f32> {
  return vec4<f32>(color, 1.0);
}
`.trim()

  navigator.clipboard.writeText(defaultCode)
    .then(() => console.log("Starter code copied to clipboard"))
    .catch(err => console.error("Failed to copy:", err))
}

function removeMesh() {
  uploadedMesh.name = ''
  uploadedMesh.content = ''
  uploadedMesh.vertexData = null
}

function renderClipboardIcon() {
  return h(NIcon, null, {
    default: () => h(ClipboardOutline)
  })
}

const showMeshModal = ref(false)

const presetMeshes = [
  'triangle.obj',
  'sphere.obj',
  'circle.obj'
]

function openMeshModal() {
  showMeshModal.value = true
}

function selectPresetMesh(meshName: string) {
  fetch(`/splitshade/mesh/${meshName}`)
    .then(res => res.text())
    .then(content => {
      uploadedMesh.name = meshName
      uploadedMesh.content = content
      uploadedMesh.vertexData = parseObjToVertices(content)
      console.log(`Loaded preset mesh: ${meshName}`)
    })
    .catch(err => console.error("Failed to load preset mesh:", err))

  showMeshModal.value = false
}

function downloadMesh(meshName: string) {
  if (!meshName) return;  // Prevent accidental undefined calls
  const link = document.createElement('a')
  link.href = `/splitshade/mesh/${meshName}`
  link.download = meshName
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
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
              <!-- only this wrapper is inline-flex -->
              <div style="display:inline-flex; align-items:center; gap:8px; margin-top:8px;">
                <n-button @click="openMeshModal">Select / Upload .OBJ Mesh</n-button>
                <!-- <n-upload
                  accept=".obj"
                  :custom-request="handleMeshUpload"
                  :show-file-list="false"
                  style="display:inline-block;"
                >
                  <n-button>Upload .OBJ Mesh</n-button>
                </n-upload> -->

                <n-button
                  :disabled="!uploadedMesh.name"
                  tag="div"
                  type="error"
                  @click="removeMesh"
                >
                  Remove {{ uploadedMesh.name ? uploadedMesh.name : '.OBJ Mesh' }}
                </n-button>

                <!-- <span v-if="uploadedMesh.name" style="color:white; white-space:nowrap;">
                  <strong>Uploaded:</strong> {{ uploadedMesh.name }}
                </span> -->
              </div>

              <!-- this lives outside the inline-flex container so the checkbox appears below -->
              <div style="margin-top:12px; display: flex; align-items: center; gap: 12px;">
                <n-button ghost size="small" @click="copyStarterCode" :render-icon="renderClipboardIcon">
                  Copy Starter Shader
                </n-button>
              </div>

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

            <n-modal v-model:show="showMeshModal">
              <n-card title="Select or Upload Mesh" style="width: 480px">
                <div style="margin-bottom: 16px;">
                  <h4 style="margin: 0 0 8px; color: white;">Preset Meshes:</h4>
                  <n-space vertical size="small">
                    <div
                      v-for="mesh in presetMeshes"
                      :key="mesh"
                      style="display: flex; align-items: center; justify-content: space-between;"
                    >
                      <n-button
                        text
                        style="font-weight: bold;"
                        @click="selectPresetMesh(mesh)"
                      >
                        {{ mesh }}
                      </n-button>

                      <n-button
                        text
                        size="small"
                        @click="downloadMesh(mesh)"
                        title="Open raw .obj in new tab"
                      >
                        <NIcon size="18">
                          <DownloadOutline />
                        </NIcon>
                      </n-button>
                    </div>
                  </n-space>
                </div>

                <n-upload
                  accept=".obj"
                  :custom-request="handleMeshUpload"
                  :show-file-list="false"
                >
                  <n-button block>Upload New .OBJ Mesh</n-button>
                </n-upload>
              </n-card>
            </n-modal>

        </n-card>


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

.panel {
  background-color: #1a1a1a;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.editor {
  grid-row: 1 / span 2; /* Span both rows */
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
