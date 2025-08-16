<script setup lang="ts">
import { computed, nextTick, watch } from 'vue'
import { NModal, NCard, NSpace, NButton, NIcon, NUpload } from 'naive-ui'
import { DownloadOutline } from '@vicons/ionicons5'

const props = defineProps<{
  show: boolean
  presetMeshes: string[]
}>()

const emit = defineEmits<{
  'update:show': [val: boolean]
  'selectPresetMesh': [meshName: string]
  'downloadMesh': [meshName: string]
  'handleUpload': [payload: { file: any; onFinish: () => void }]
}>()

const showProxy = computed({
  get: () => props.show,
  set: (val) => emit('update:show', val),
})

// Prevent misleading focus highlight on first preset button when modal opens
// Browsers auto-focus the first focusable element (the first .obj button), which Naive UI styles with a green outline
// This watch removes focus from that element after the modal is mounted to avoid visual confusion
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
