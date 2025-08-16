<!--
/**
 * EditorPanel Component
 *
 * Monaco editor interface for WGSL shader development with syntax highlighting,
 * error navigation, and shader execution controls. Provides a full-featured
 * code editing experience within the shader playground.
 *
 * @component
 */
-->
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
      style="flex: 1; min-height: 0;"
      :options="editorOptions"
      @change="onCodeChange"
      @mount="onEditorMount"
    />
    <!-- flex 1 above ensures editor takes space within the container while still respecting footer element-->
    <template #footer>
      <n-button block @click="runShader">Run Shader</n-button>
    </template>
  </n-card>
</template>

<script setup lang="ts">
import { VueMonacoEditor } from '@guolao/vue-monaco-editor'
import * as monaco from 'monaco-editor'
import { ref, watch, onBeforeUnmount, nextTick } from 'vue'

/**
 * Component props interface.
 *
 * @param code - Current shader source code
 * @param runShader - Function to execute the shader
 */
const props = defineProps<{
  code: string
  runShader: () => void
}>()

/**
 * Component event emissions.
 *
 * Emits the following events:
 * - update:code: Emitted when editor content changes
 * - go-to-line: Emitted to navigate to specific line number
 * - reset-to-default: Emitted when reset button is clicked
 * - clear: Emitted when clear button is clicked
 * - editor-ready: Emitted when Monaco editor is initialized
 */
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

/**
 * Provides local persistence for editor contents using localStorage.
 *
 * Automatically saves editor content on changes and restores saved content
 * when the editor mounts. Enables work preservation across browser sessions.
 *
 * @param editor - Monaco editor instance
 * @param key - localStorage key for persisting content
 */
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

/**
 * Synchronizes local state when parent code prop changes.
 *
 * Ensures editor content stays consistent with external updates
 * while preventing infinite update loops.
 */
watch(() => props.code, (newVal) => {
  if (newVal !== localCode.value) {
    localCode.value = newVal
  }
})

/**
 * Handles editor content changes and emits updates to parent.
 *
 * @param val - New editor content
 */
function onCodeChange(val: string) {
  localCode.value = val
  emit('update:code', val)
}

/**
 * Emits reset-to-default event to parent component.
 */
function resetToDefault() {
  emit('reset-to-default')
}

/**
 * Emits clear event to parent component.
 */
function clearEditor() {
  emit('clear')
}

/**
 * Handles Monaco editor initialization and setup.
 *
 * @param editor - Mounted Monaco editor instance
 */
function onEditorMount(editor: monaco.editor.IStandaloneCodeEditor) {
  editorInstance = editor
  persistEditor(editor)
}

/**
 * Programmatically navigates to a specific line and column in the editor.
 *
 * Used for error navigation when users click on console error messages.
 * Reveals the target line and focuses the editor for immediate editing.
 *
 * @param lineNumber - Target line number (1-based)
 * @param column - Target column number (1-based, optional)
 */
function goToLine(lineNumber: number, column?: number) {
  if (editorInstance) {
    editorInstance.revealLineInCenter(lineNumber)
    editorInstance.setPosition({ lineNumber, column: column || 1 })
    editorInstance.focus()
  }
}

/**
 * Exposed component methods for parent component access.
 *
 * Allows parent components to programmatically control editor behavior
 * such as navigation to specific lines for error handling.
 */
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
