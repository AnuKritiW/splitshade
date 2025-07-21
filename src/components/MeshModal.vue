<script setup lang="ts">
import { computed } from 'vue'
import { NModal, NCard, NSpace, NButton, NIcon, NUpload } from 'naive-ui'
import { DownloadOutline } from '@vicons/ionicons5'

const props = defineProps<{
  show: boolean
  presetMeshes: string[]
}>()

const emit = defineEmits<{
  (e: 'update:show', val: boolean): void
  (e: 'selectPresetMesh', meshName: string): void
  (e: 'downloadMesh', meshName: string): void
  (e: 'handleUpload', payload: { file: any; onFinish: () => void }): void
}>()

const showProxy = computed({
  get: () => props.show,
  set: (val) => emit('update:show', val),
})
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
              @click="emit('downloadMesh', mesh)"
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
        :custom-request="(payload) => emit('handleUpload', payload)"
        :show-file-list="false"
      >
        <n-button block>Upload New .OBJ Mesh</n-button>
      </n-upload>
    </n-card>
  </n-modal>
</template>
