<!--
  SPDX-License-Identifier: GPL-3.0-only

  SplitShade: WebGPU Playground
  Copyright (C) 2025 Anu Kriti Wadhwa

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, version 3 of the License.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with this program.  If not, see <https://www.gnu.org/licenses/>.
-->
<script setup lang="ts">
/**
 * SplitShade WebGPU Playground - Main Application Component
 *
 * A browser-based shader editor and renderer for WGSL (WebGPU Shading Language).
 * Provides a complete development environment with:
 * - Monaco-based code editor with WGSL syntax highlighting
 * - Real-time WebGPU shader compilation and rendering
 * - Texture management and upload capabilities
 * - 3D mesh loading and visualization
 * - Comprehensive error reporting and debugging tools
 * - Export and sharing functionality
 *
 * The interface is organized in a 2x2 grid layout:
 * - Top-left: Code editor with shader controls
 * - Top-right: Real-time preview canvas
 * - Bottom-left: Texture and mesh resource management
 * - Bottom-right: Console with compilation output and errors
 */

import { loader } from '@guolao/vue-monaco-editor'
import { LogoGithub } from '@vicons/ionicons5'
import { darkTheme } from 'naive-ui'
import { ref, nextTick } from 'vue'

import ConsolePanel from './ui/components/panels/ConsolePanel.vue'
import EditorPanel from './ui/components/panels/EditorPanel.vue'
import PreviewPanel from './ui/components/panels/PreviewPanel.vue'
import ResourcesPanel from './ui/components/panels/ResourcesPanel.vue'
import WebGPUWarning from './ui/components/WebGPUWarning.vue'
import { useMesh } from './ui/composables/useMesh'
import { useShaderRunner } from './ui/composables/useShaderRunner'
import { useTextures } from './ui/composables/useTextures'
import './ui/styles/app.css'

/** Default fragment shader code displayed on application startup */
const DEFAULT_SHADER_CODE = `@fragment
fn main(@builtin(position) coord: vec4<f32>) -> @location(0) vec4<f32> {
    let uv = coord.xy / iResolution.xy;
    let color = vec3<f32>(uv.x, uv.y, 0.5);
    return vec4<f32>(color, 1.0);
}`

/** Reactive reference to the current shader code in the editor */
const code = ref(DEFAULT_SHADER_CODE)

/**
 * Handles the editor ready event by auto-running the default shader.
 *
 * This ensures users see immediate visual feedback when the application loads,
 * demonstrating that the WebGPU pipeline is working correctly.
 */
function handleEditorReady() {
  nextTick(() => {
    handleRunShader()
  })
}

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
/** Reactive array storing structured error information from shader compilation */
const structuredErrors = ref<Array<{
  /** Human-readable error message */
  message: string;
  /** Line number in user code where error occurred */
  line: number;
  /** Column number where error occurred */
  column: number;
  /** Error type (error, warning, info) */
  type: string;
  /** Character offset in source code */
  offset: number;
  /** Length of the problematic code section */
  length: number;
}>>([])

const { runShader } = useShaderRunner()

/**
 * Opens the SplitShade documentation in a new tab.
 */
function openDocs() {
  window.open('https://anukritiw.github.io/splitshade-docs/', '_blank')
}

/**
 * Handles hover effects on the application title.
 *
 * @param event - Mouse event from the title element
 * @param opacity - Target opacity value as a string
 */
function handleTitleHover(event: MouseEvent, opacity: string) {
  const target = event.target as HTMLElement
  if (target) {
    target.style.opacity = opacity
  }
}

/**
 * Compiles and runs the current shader code with selected textures and mesh data.
 *
 * Clears previous output, processes texture inputs, and initiates the WebGPU
 * rendering pipeline. Results are displayed in the preview canvas with any
 * compilation messages or errors shown in the console panel.
 */
function handleRunShader() {
  if (!previewRef.value?.canvasRef) return
  consoleOutput.value = ''
  structuredErrors.value = []

  // Filter out null texture values to create a clean texture map
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

/**
 * Navigates the editor to a specific line and column.
 *
 * Used primarily for error navigation - when users click on error messages
 * in the console, this function jumps the editor cursor to the problematic code.
 *
 * @param line - Line number to navigate to (1-based)
 * @param column - Optional column number to navigate to (1-based)
 */
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
