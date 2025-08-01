<script setup lang="ts">
import { darkTheme } from 'naive-ui'
import { ref } from 'vue'
const code = ref(`// Write your WGSL code here`)

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
const consoleOutput = ref("")

const { runShader } = useShaderRunner()

function handleRunShader() {
  if (!previewRef.value?.canvasRef) return
  consoleOutput.value = ''

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
    }
  })
}
</script>

<template>
  <WebGPUWarning />
  <n-config-provider :theme="darkTheme">
    <div class="root-grid">
      <n-layout-header bordered style="padding: 12px;">
        <div class="header-content">
          <h2 style="margin: 0; color: white;">SplitShade: WebGPU Playground</h2>
          <div class="header-links">
            <n-button
              class="docs-button"
              text
              tag="a"
              href="https://anukritiw.github.io/splitshade-docs"
              target="_blank"
              rel="noopener"
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
        <EditorPanel v-model:code="code" :runShader="handleRunShader" />

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
