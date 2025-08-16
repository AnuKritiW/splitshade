<script setup lang="ts">
/**
 * ResourcesPanel Component
 *
 * Manages texture and mesh resources for the shader editor.
 * Provides tabbed interface for:
 * - Texture selection and upload for iChannel0-3 slots
 * - 3D mesh loading (preset and user uploads)
 * - Utility functions like copying starter shader code
 *
 * Integrates with modal components for detailed resource selection.
 */

import { ClipboardOutline } from '@vicons/ionicons5'
import { NIcon } from 'naive-ui'
import { computed, h } from 'vue'

import MeshModal from '@/ui/components/modals/MeshModal.vue'
import TextureModal from '@/ui/components/modals/TextureModal.vue'

/** Type definition for shader texture channel identifiers */
type ChannelKey = 'iChannel0' | 'iChannel1' | 'iChannel2' | 'iChannel3'
const channelList: ChannelKey[] = ['iChannel0', 'iChannel1', 'iChannel2', 'iChannel3']

const props = defineProps<{
  /** Currently selected textures for each channel (URL or null) */
  selectedTextures: Record<string, string | null>
  /** Array of all available texture URLs */
  allTextures: string[]
  /** Controls visibility of the texture selection modal */
  showTextureModal: boolean
  /** Controls visibility of the mesh selection modal */
  showMeshModal: boolean
  /** Array of preset mesh filenames available for loading */
  presetMeshes: string[]
  /** Information about the currently uploaded mesh */
  uploadedMesh: { name: string }
}>()

const emit = defineEmits<{
  /** Request to open texture modal for specific channel */
  'openTextureModal': [channel: ChannelKey]
  /** Request to open mesh selection modal */
  'openMeshModal': []
  /** Request to remove currently loaded mesh */
  'removeMesh': []
  /** Request to copy vertex shader starter code to clipboard */
  'copyStarterCode': []
  /** User selected a texture from the texture modal */
  'selectTexture': [img: string]
  /** User uploaded a new texture file */
  'handleTextureUpload': [payload: { file: File; onFinish: () => void }]
  /** User selected a preset mesh */
  'selectPresetMesh': [mesh: string]
  /** User requested to download a mesh file */
  'downloadMesh': [mesh: string]
  /** User uploaded a new mesh file */
  'handleMeshUpload': [options: any]
  /** Texture modal visibility state changed */
  'update:showTextureModal': [value: boolean]
  /** Mesh modal visibility state changed */
  'update:showMeshModal': [value: boolean]
}>()

function renderClipboardIcon() {
  return h(NIcon, null, {
    default: () => h(ClipboardOutline)
  })
}

const showTextureModalProxy = computed({
  get: () => props.showTextureModal,
  set: (val) => emit('update:showTextureModal', val)
})

const showMeshModalProxy = computed({
  get: () => props.showMeshModal,
  set: (val) => emit('update:showMeshModal', val)
})

function handleSelectTexture(img: string) {
  emit('selectTexture', img)
}

function handleTextureUpload(payload: { file: any; onFinish: () => void }) {
  emit('handleTextureUpload', payload)
}
</script>

<template>
  <n-card
    title="Resources"
    size="small"
    embedded
    class="resources-card"
    style="grid-row: 2; grid-column: 1;"
  >
    <n-tabs type="segment" animated>
      <n-tab-pane name="textures" tab="Textures">
        <div class="texture-buttons">
          <n-button
            v-for="channel in channelList"
            :key="channel"
            size="small"
            block
            class="n-button texture-button"
            @click="$emit('openTextureModal', channel)"
          >
            <template #default>
              <img
                v-if="selectedTextures[channel]"
                :src="selectedTextures[channel]"
                :alt="channel"
                class="button-bg"
              >
              <span class="button-label">{{ channel }}</span>
            </template>
          </n-button>
        </div>
      </n-tab-pane>

      <n-tab-pane name="mesh" tab="Mesh">
        <div class="mesh-buttons-row">
          <n-button @click="$emit('openMeshModal')">Select / Upload .OBJ Mesh</n-button>
          <n-button
            :disabled="!uploadedMesh.name"
            tag="div"
            type="error"
            @click="$emit('removeMesh')"
          >
            Remove {{ uploadedMesh.name || '.OBJ Mesh' }}
          </n-button>
        </div>

        <div class="mesh-actions-row">
          <n-button ghost size="small" :render-icon="renderClipboardIcon" @click="$emit('copyStarterCode')">
            Copy Starter Shader
          </n-button>
        </div>
      </n-tab-pane>
    </n-tabs>

    <TextureModal
      v-model:show="showTextureModalProxy"
      :allTextures="allTextures"
      @selectTexture="handleSelectTexture"
      @handleUpload="handleTextureUpload"
    />

    <MeshModal
      v-model:show="showMeshModalProxy"
      :presetMeshes="presetMeshes"
      @selectPresetMesh="emit('selectPresetMesh', $event)"
      @downloadMesh="emit('downloadMesh', $event)"
      @handleUpload="emit('handleMeshUpload', $event)"
    />
  </n-card>
</template>

<style scoped>
.resources-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.resources-card :deep(.n-card) {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.resources-card :deep(.n-card__content) {
  flex: 1;
  overflow: hidden;
}

/* Responsive mesh buttons */
.mesh-buttons-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.mesh-buttons-row .n-button {
  flex: 0 1 auto; /* don't grow, but can shrink */
  min-width: 0;
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mesh-actions-row {
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.mesh-actions-row .n-button {
  flex: 0 1 auto; /* don't grow, but can shrink */
  min-width: 0;
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
