<template>
  <n-card title="Editor" size="small" class="panel editor" style="grid-row: 1; grid-column: 1;">
    <VueMonacoEditor
      language="wgsl"
      theme="vs-dark"
      :value="localCode"
      @change="onCodeChange"
      style="height: 100%; width: 100%;"
    />
    <template #footer>
      <n-button @click="runShader" block>Run Shader</n-button>
    </template>
  </n-card>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { VueMonacoEditor } from '@guolao/vue-monaco-editor'

const props = defineProps<{
  code: string
  runShader: () => void
}>()

const emit = defineEmits(['update:code'])

const localCode = ref(props.code)

// Update localCode when parent changes
watch(() => props.code, (newVal) => {
  if (newVal !== localCode.value) {
    localCode.value = newVal
  }
})

// Emit updates when localCode changes
function onCodeChange(val: string) {
  localCode.value = val
  emit('update:code', val)
}

</script>

<style scoped>
.editor {
  grid-row: 1 / span 2; /* Span both rows */
}
</style>
