<script setup lang="ts">
import { darkTheme } from 'naive-ui'
import { ref, nextTick } from 'vue'

const DEFAULT_SHADER_CODE = `@fragment
fn main(@builtin(position) coord: vec4<f32>) -> @location(0) vec4<f32> {
    let uv = coord.xy / iResolution.xy;
    let color = vec3<f32>(uv.x, uv.y, 0.5);
    return vec4<f32>(color, 1.0);
}`

const code = ref(DEFAULT_SHADER_CODE)

// Auto-run shader only once when editor is ready (not on subsequent code changes)
function handleEditorReady() {
  nextTick(() => {
    handleRunShader()
  })
}

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
    Object.entries(selectedTextures.value).filter(([, v]) => typeof v === 'string' && v !== null)
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

function handleResetToDefault() {
  // reset to default code
  // note that this is undoable
  // don't remove localStorage; editor's persistence handles it naturally
  if (editorRef.value?.replaceAllContent) {
    editorRef.value.replaceAllContent(DEFAULT_SHADER_CODE)
  } else {
    // Fallback to direct assignment if editor ref is not ready
    code.value = DEFAULT_SHADER_CODE
  }
}

function handleClear() {
  // clear editor
  // note that this is undoable
  // don't remove localStorage; editor's persistence handles it naturally
  if (editorRef.value?.replaceAllContent) {
    editorRef.value.replaceAllContent('')
  } else {
    // Fallback to direct assignment if editor ref is not ready
    code.value = ''
  }
}

function handleUpdateShowTextureModal(val: boolean) {
  showTextureModal.value = val
}

function handleUpdateShowMeshModal(val: boolean) {
  showMeshModal.value = val
}
</script>

<template>
  <WebGPUWarning />
  <n-config-provider :theme="darkTheme">
    <div class="root-grid">
      <n-layout-header bordered style="padding: 12px;">
        <div class="header-content">
          <h2
            style="margin: 0; color: white; cursor: pointer; user-select: none; transition: opacity 0.2s ease;"
            title="Click to open documentation"
            @click="openDocs"
            @mouseenter="handleTitleHover($event, '0.8')"
            @mouseleave="handleTitleHover($event, '1')"
          >
            SplitShade: WebGPU Playground
          </h2>
          <div class="header-links">
            <n-button
              class="docs-button"
              text
              title="Read the docs"
              @click="openDocs"
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
          @reset-to-default="handleResetToDefault"
          @clear="handleClear"
          @editor-ready="handleEditorReady"
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
          @update:showTextureModal="handleUpdateShowTextureModal"
          @update:showMeshModal="handleUpdateShowMeshModal"
        />

        <!-- Console (bottom-right) -->
        <ConsolePanel
          :console-output="consoleOutput"
          :shader-code="code"
          :structured-errors="structuredErrors"
          style="grid-row: 2; grid-column: 2;"
          @go-to-line="handleGoToLine"
        />

      </div>
    </div>
  </n-config-provider>
</template>
