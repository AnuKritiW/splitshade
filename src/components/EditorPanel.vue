<template>
  <n-card title="Editor" size="small" class="panel editor" style="grid-row: 1; grid-column: 1;">
    <template #header-extra>
      <div style="display: flex; gap: 8px;">
        <n-button size="small" ghost @click="resetToDefault">
          Reset to Default
        </n-button>
        <n-button size="small" ghost @click="clearEditor">
          Clear
        </n-button>
      </div>
    </template>
    <VueMonacoEditor
      ref="editorRef"
      language="wgsl"
      theme="vs-dark"
      :value="localCode"
      @change="onCodeChange"
      @mount="onEditorMount"
      style="flex: 1; min-height: 0;"
      :options="editorOptions"
    />
    <!-- flex 1 above ensures editor takes space within the container while still respecting footer element-->
    <template #footer>
      <n-button @click="runShader" block>Run Shader</n-button>
    </template>
  </n-card>
</template>

<script setup lang="ts">
import { ref, watch, onBeforeUnmount, nextTick } from 'vue'
import { VueMonacoEditor } from '@guolao/vue-monaco-editor'
import * as monaco from 'monaco-editor'

const props = defineProps<{
  code: string
  runShader: () => void
}>()

const emit = defineEmits(['update:code', 'go-to-line', 'reset-to-default', 'clear', 'editor-ready'])

const localCode = ref(props.code)
const editorRef = ref()
let editorInstance: monaco.editor.IStandaloneCodeEditor | null = null
let disposeListeners: monaco.IDisposable[] = []

// Editor options
const editorOptions = {
  automaticLayout: true,
  fontSize: 14,
  lineNumbers: 'on' as const,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  wordWrap: 'on' as const,
}

// add local persistence for editor contents
function persistEditor(editor: monaco.editor.IStandaloneCodeEditor, key = 'splitshade:editorCode:v1') {
  // load saved code from localStorage
  const savedCode = localStorage.getItem(key)
  if (savedCode && savedCode !== props.code) {
    editor.setValue(savedCode)
    localCode.value = savedCode
    emit('update:code', savedCode)  // triggers code.value = persisted code
  }

  // save code on content change
  const dispose = editor.onDidChangeModelContent(() => {
    const currentValue = editor.getValue()
    localStorage.setItem(key, currentValue)
  })

  disposeListeners.push(dispose)

  // Signal that editor is ready (persistence has been loaded)
  nextTick(() => {
    emit('editor-ready')
  })
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

// Reset to default code
function resetToDefault() {
  emit('reset-to-default')
}

// Clear editor content
function clearEditor() {
  emit('clear')
}

// Handle editor mount
function onEditorMount(editor: monaco.editor.IStandaloneCodeEditor) {
  editorInstance = editor
  persistEditor(editor)
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
  goToLine,
  replaceAllContent: (newContent: string) => {
    if (editorInstance) {
      const model = editorInstance.getModel()
      if (model) {
        const fullRange = model.getFullModelRange()
        editorInstance.executeEdits('reset-or-clear', [{
          range: fullRange,
          text: newContent
        }])
      }
    }
  }
})

// cleanup listeners on component unmount
onBeforeUnmount(() => {
  disposeListeners.forEach(dispose => dispose.dispose())
  disposeListeners = []
})

</script>

<style scoped>
.panel {
  background-color: #1a1a1a;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.editor {
  grid-row: 1;
  grid-column: 1;
}

/* Ensure the card structure maintains proper layout */
.editor :deep(.n-card) {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.editor :deep(.n-card__content) {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0; /* Allow Monaco to shrink */
  overflow: hidden;
}

/* Footer should never shrink; we need Run Shader button to always be visible */
.editor :deep(.n-card__footer) {
  flex-shrink: 0;
}

/* Monaco Editor container should flex within the card content */
.editor :deep(.monaco-editor) {
  flex: 1;
  min-height: 0;
}
</style>
