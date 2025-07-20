<script setup lang="ts">
import { computed } from 'vue'
import { NModal, NCard, NImage, NUpload, NButton } from 'naive-ui'

const props = defineProps<{
  show: boolean
  allTextures: string[]
}>()

const emit = defineEmits<{
  (e: 'update:show', val: boolean): void
  (e: 'selectTexture', img: string): void
  (e: 'handleUpload', payload: { file: any, onFinish: () => void }): void
}>()

// Required to support v-model:show cleanly
const showProxy = computed({
  get: () => props.show,
  set: (val) => emit('update:show', val)
})
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
          @click="emit('selectTexture', img)"
          :preview-disabled="true"
        />
      </div>
      <!-- upload button -->
      <n-upload
        accept="image/*"
        :custom-request="(payload) => emit('handleUpload', payload)"
        :show-file-list="false"
      >
        <n-button block>Upload New Texture</n-button>
      </n-upload>
    </n-card>
  </n-modal>
</template>
