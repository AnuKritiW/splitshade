<script setup lang="ts">
import { darkTheme } from 'naive-ui'
import { ref, onMounted, nextTick } from 'vue'
const code = ref(`@fragment
fn main(@builtin(position) coord: vec4<f32>) -> @location(0) vec4<f32> {
    let uv = coord.xy / iResolution.xy;
    let color = vec3<f32>(uv.x, uv.y, 0.5);
    return vec4<f32>(color, 1.0);
}`)

import { loader } from '@guolao/vue-monaco-editor'
import { LogoGithub } from '@vicons/ionicons5'

import { useShaderRunner } from './composables/useShaderRunner'
import ConsolePanel from './components/ConsolePanel.vue'
import PreviewPanel from './components/PreviewPanel.vue'
import EditorPanel from './components/EditorPanel.vue'
import { useTextures } from './composables/useTextures'
import { useMesh } from './composables/useMesh'
import ResourcesPanel from './components/ResourcesPanel.vue'
import WebGPUWarning from './components/WebGPUWarning.vue'
import './styles/app.css'

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

const previewRef = ref<InstanceType<typeof PreviewPanel> | null>(null)
const editorRef = ref<InstanceType<typeof EditorPanel> | null>(null)
const consoleOutput = ref("")
const structuredErrors = ref<Array<{
  message: string;
  line: number;
  column: number;
  type: string;
  offset: number;
  length: number;
}>>([])

const { runShader } = useShaderRunner()

function openDocs() {
  window.open('https://anukritiw.github.io/splitshade-docs/', '_blank')
}

function handleTitleHover(event: MouseEvent, opacity: string) {
  const target = event.target as HTMLElement
  if (target) {
    target.style.opacity = opacity
  }
}

function handleRunShader() {
  if (!previewRef.value?.canvasRef) return
  consoleOutput.value = ''
  structuredErrors.value = []

  const validTextures = Object.fromEntries(
    Object.entries(selectedTextures.value).filter(([_, v]) => typeof v === 'string' && v !== null)
  ) as Record<string, string>

  runShader({
    canvas: previewRef.value.canvasRef,
    code: code.value,
    textures: validTextures,
    mesh: uploadedMesh.vertexData,
    onLog: msg => {
      consoleOutput.value += (msg || 'Compiled successfully') + '\n'
    },
    onStructuredErrors: errors => {
      structuredErrors.value = errors
    }
  })
}

function handleGoToLine(line: number, column?: number) {
  console.log(`App.vue: navigating to line ${line}${column ? `, column ${column}` : ''}`);
  if (editorRef.value) {
    editorRef.value.goToLine(line, column)
  }
}

// auto-run the initial shader when the app mounts
onMounted(() => {
  // Wait for the next DOM update cycle to ensure all child components are rendered
  nextTick(() => {
    handleRunShader()
  })
})
</script>

<template>
  <WebGPUWarning />
  <n-config-provider :theme="darkTheme">
    <div class="root-grid">
      <n-layout-header bordered style="padding: 12px;">
        <div class="header-content">
          <h2
            style="margin: 0; color: white; cursor: pointer; user-select: none; transition: opacity 0.2s ease;"
            @click="openDocs"
            @mouseenter="handleTitleHover($event, '0.8')"
            @mouseleave="handleTitleHover($event, '1')"
            title="Click to open documentation"
          >
            SplitShade: WebGPU Playground
          </h2>
          <div class="header-links">
            <n-button
              class="docs-button"
              text
              @click="openDocs"
              title="Read the docs"
            >
              <span>Docs ↗</span>
            </n-button>
            <n-button
              text
              tag="a"
              href="https://github.com/AnuKritiW/splitshade-webgpu-playground"
              target="_blank"
              rel="noopener"
              title="View on GitHub"
            >
              <template #icon>
                <n-icon size="28">
                  <LogoGithub />
                </n-icon>
              </template>
            </n-button>
          </div>
        </div>
      </n-layout-header>

      <div class="grid-container">
        <!-- Editor (top-left) -->
        <EditorPanel
          ref="editorRef"
          v-model:code="code"
          :runShader="handleRunShader"
          @go-to-line="handleGoToLine"
        />

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
          @update:showTextureModal="(val: boolean) => showTextureModal = val"
          @update:showMeshModal="(val: boolean) => showMeshModal = val"
        />

        <!-- Console (bottom-right) -->
        <ConsolePanel
          :console-output="consoleOutput"
          :shader-code="code"
          :structured-errors="structuredErrors"
          @go-to-line="handleGoToLine"
          style="grid-row: 2; grid-column: 2;"
        />

      </div>
    </div>
  </n-config-provider>
</template>
