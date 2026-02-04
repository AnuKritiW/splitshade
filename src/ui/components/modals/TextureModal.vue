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
 * TextureModal Component
 *
 * Modal interface for texture selection and upload in the shader playground.
 * Displays available textures in a grid layout and provides upload functionality
 * for custom texture assets to be used in iChannel bindings.
 *
 * @component
 */
-->
<script setup lang="ts">
import { NModal, NCard, NImage, NUpload, NButton } from 'naive-ui'
import { computed } from 'vue'

/**
 * Component props interface.
 *
 * @param show - Modal visibility state
 * @param allTextures - Array of available texture URLs for selection
 */
const props = defineProps<{
  show: boolean
  allTextures: string[]
}>()

/**
 * Component event emissions.
 *
 * Emits the following events:
 * - update:show: Emitted when modal visibility changes (v-model support)
 * - selectTexture: Emitted when a texture is selected from the grid
 * - handleUpload: Emitted when a new texture file is uploaded
 */
const emit = defineEmits<{
  'update:show': [val: boolean]
  'selectTexture': [img: string]
  'handleUpload': [payload: { file: any, onFinish: () => void }]
}>()

/**
 * Computed property for v-model:show support.
 *
 * Provides two-way binding for modal visibility state with
 * proper getter/setter implementation for Vue's v-model directive.
 */
const showProxy = computed({
  get: () => props.show,
  set: (val) => emit('update:show', val)
})

/**
 * Handles texture file upload operations.
 *
 * @param payload - Upload payload containing file and completion callback
 */
function handleUpload(payload: { file: any; onFinish: () => void }) {
  emit('handleUpload', payload)
}
</script>

<template>
  <n-modal v-model:show="showProxy">
    <n-card title="Select or Upload Texture" style="width: 600px">
      <!-- image grid -->
      <div class="thumbnail-grid" style="display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 16px;">
        <n-image
          v-for="(img, index) in allTextures"
          :key="index"
          :src="img"
          width="80"
          height="80"
          style="cursor: pointer; border-radius: 4px"
          :preview-disabled="true"
          @click="emit('selectTexture', img)"
        />
      </div>
      <!-- upload button -->
      <n-upload
        accept="image/*"
        :custom-request="handleUpload"
        :show-file-list="false"
      >
        <n-button block>Upload New Texture</n-button>
      </n-upload>
    </n-card>
  </n-modal>
</template>
