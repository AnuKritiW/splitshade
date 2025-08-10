<template>
  <n-card title="Editor" size="small" class="panel editor" style="grid-row: 1; grid-column: 1;">
    <VueMonacoEditor
      ref="editorRef"
      language="wgsl"
      theme="vs-dark"
      :value="localCode"
      @change="onCodeChange"
      @mount="onEditorMount"
      style="height: 100%; width: 100%;"
      :options="editorOptions"
    />
    <template #footer>
      <n-button @click="runShader" block>Run Shader</n-button>
    </template>
  </n-card>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { VueMonacoEditor } from '@guolao/vue-monaco-editor'
import * as monaco from 'monaco-editor'

const props = defineProps<{
  code: string
  runShader: () => void
}>()

const emit = defineEmits(['update:code', 'go-to-line'])

const localCode = ref(props.code)
const editorRef = ref()
let editorInstance: monaco.editor.IStandaloneCodeEditor | null = null

// Editor options
const editorOptions = {
  automaticLayout: true,
  fontSize: 14,
  lineNumbers: 'on' as const,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  wordWrap: 'on' as const,
}

// Update localCode when parent changes
watch(() => props.code, (newVal) => {
  if (newVal !== localCode.value) {
    localCode.value = newVal
  }
})

// Monaco doesn't have native syntax validation for WGSL
// so rely on the console panel for error display
// instead of editor markers (i.e. gutter markers, squiggly lines)

// Emit updates when localCode changes
function onCodeChange(val: string) {
  localCode.value = val
  emit('update:code', val)
}

// Handle editor mount
function onEditorMount(editor: monaco.editor.IStandaloneCodeEditor) {
  editorInstance = editor
}

// Method to programmatically go to a specific line and optionally column
function goToLine(lineNumber: number, column?: number) {
  if (editorInstance) {
    editorInstance.revealLineInCenter(lineNumber)
    editorInstance.setPosition({ lineNumber, column: column || 1 })
    editorInstance.focus()
  }
}

// Expose methods for parent components
defineExpose({
  goToLine
})

</script>

<style scoped>
.editor {
  grid-row: 1 / span 2; /* Span both rows */
}
</style>
