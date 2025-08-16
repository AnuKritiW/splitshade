<script setup lang="ts">
import { computed, h } from 'vue'
import { NIcon } from 'naive-ui'
import { ClipboardOutline } from '@vicons/ionicons5'
import TextureModal from './TextureModal.vue'
import MeshModal from './MeshModal.vue'

type ChannelKey = 'iChannel0' | 'iChannel1' | 'iChannel2' | 'iChannel3'
const channelList: ChannelKey[] = ['iChannel0', 'iChannel1', 'iChannel2', 'iChannel3']

const props = defineProps<{
  selectedTextures: Record<string, string | null>
  allTextures: string[]
  showTextureModal: boolean
  showMeshModal: boolean
  presetMeshes: string[]
  uploadedMesh: { name: string }
}>()

const emit = defineEmits<{
  (e: 'openTextureModal', channel: ChannelKey): void
  (e: 'openMeshModal'): void
  (e: 'removeMesh'): void
  (e: 'copyStarterCode'): void
  (e: 'selectTexture', img: string): void
  (e: 'handleTextureUpload', payload: { file: File; onFinish: () => void }): void
  (e: 'selectPresetMesh', mesh: string): void
  (e: 'downloadMesh', mesh: string): void
  (e: 'handleMeshUpload', options: any): void
  (e: 'update:showTextureModal', value: boolean): void
  (e: 'update:showMeshModal', value: boolean): void
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
            @click="$emit('openTextureModal', channel)"
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
          <n-button ghost size="small" @click="$emit('copyStarterCode')" :render-icon="renderClipboardIcon">
            Copy Starter Shader
          </n-button>
        </div>
      </n-tab-pane>
    </n-tabs>

    <TextureModal
      v-model:show="showTextureModalProxy"
      :allTextures="allTextures"
      @selectTexture="(img: string) => emit('selectTexture', img)"
      @handleUpload="(payload: { file: any; onFinish: () => void }) => emit('handleTextureUpload', payload)"
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
