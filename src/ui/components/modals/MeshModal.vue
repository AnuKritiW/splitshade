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
<!--
/**
 * MeshModal Component
 *
 * Modal interface for 3D mesh selection and upload in the shader playground.
 * Provides access to preset geometry and custom .obj file upload capabilities
 * for vertex-based shader rendering.
 *
 * @component
 */
-->
<script setup lang="ts">
import { DownloadOutline } from '@vicons/ionicons5'
import { NModal, NCard, NSpace, NButton, NIcon, NUpload } from 'naive-ui'
import { computed, nextTick, watch } from 'vue'

/**
 * Component props interface.
 *
 * @param show - Modal visibility state
 * @param presetMeshes - Array of available preset mesh names
 */
const props = defineProps<{
  show: boolean
  presetMeshes: string[]
}>()

/**
 * Component event emissions.
 *
 * Emits the following events:
 * - update:show: Emitted when modal visibility changes (v-model support)
 * - selectPresetMesh: Emitted when a preset mesh is selected
 * - downloadMesh: Emitted when mesh download is requested
 * - handleUpload: Emitted when a custom .obj file is uploaded
 */
const emit = defineEmits<{
  'update:show': [val: boolean]
  'selectPresetMesh': [meshName: string]
  'downloadMesh': [meshName: string]
  'handleUpload': [payload: { file: any; onFinish: () => void }]
}>()

/**
 * Computed property for v-model:show support.
 *
 * Provides two-way binding for modal visibility state with
 * proper getter/setter implementation for Vue's v-model directive.
 */
const showProxy = computed({
  get: () => props.show,
  set: (val) => emit('update:show', val),
})

/**
 * Prevents misleading focus highlight on modal open.
 *
 * Browsers auto-focus the first focusable element when modals open,
 * which can cause visual confusion with Naive UI's focus styling.
 * This watcher removes focus after the modal mounts.
 */
watch(
  () => props.show,
  (newVal) => {
    if (newVal) {
      nextTick(() => {
        // Remove focus from the first auto-focused button
        const focused = document.activeElement as HTMLElement
        if (focused && focused.tagName === 'BUTTON') {
          focused.blur()
        }
      })
    }
  }
)

/**
 * Handles mesh file upload operations.
 *
 * @param payload - Upload payload containing .obj file and completion callback
 */
function handleUpload(payload: { file: any; onFinish: () => void }) {
  emit('handleUpload', payload)
}
</script>

<template>
  <n-modal v-model:show="showProxy">
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
              @click="emit('selectPresetMesh', mesh)"
            >
              {{ mesh }}
            </n-button>

            <n-button
              text
              size="small"
              title="Open raw .obj in new tab"
              @click="emit('downloadMesh', mesh)"
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
        :custom-request="handleUpload"
        :show-file-list="false"
      >
        <n-button block>Upload New .OBJ Mesh</n-button>
      </n-upload>
    </n-card>
  </n-modal>
</template>
