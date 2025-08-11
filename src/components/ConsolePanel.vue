<template>
  <!-- Console (bottom-right) -->
  <n-card title="Console" size="small" class="panel-console" style="grid-row: 2; grid-column: 2;">
    <n-scrollbar style="max-height: 100%;">
      <div class="console-content">
      <!-- Always show raw console output first for context -->
      <div v-if="statusOutput" class="console-pre non-error-output">
        {{ statusOutput }}
      </div>

      <!-- Structured error display -->
      <div v-if="structuredErrors.length > 0" class="structured-errors">
        <div v-for="(error, index) in structuredErrors" :key="index"
             class="error-item">
          <div class="error-header">
            <n-tag type="error" size="small">
              ERROR
            </n-tag>
            <button
              class="line-link"
              type="button"
              @click="emit('go-to-line', error.line, error.column)"
              :title="`Jump to line ${error.line}${error.column ? `, column ${error.column}` : ''}`"
            >
              Line {{ error.line }}{{ error.column ? `:${error.column}` : '' }}
            </button>
          </div>
          <div class="error-message">{{ error.message }}</div>
        </div>
      </div>

      <!-- Enhanced console output for compilation errors and fallback -->
            <!-- If no structured errors, show raw console output (minus status messages) -->
      <div v-else class="console-pre">
        <template v-for="(token, index) in tokens" :key="index">
          <span v-if="token.kind === 'text' && !isStatusMessage(token.text)">{{ token.text }}</span>
          <span v-else-if="token.kind === 'line'" class="line-number">{{ token.num }}</span>
        </template>
      </div>
    </div>
    </n-scrollbar>
  </n-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { getHeaderLineOffset, parseWebGPUErrors } from '../webgpu/parser';
import { usesAnyTextures } from '../webgpu/textures';

const props = defineProps<{
  consoleOutput: string;
  shaderCode?: string; // Add optional shader code prop
}>();

const emit = defineEmits<{
  (e: 'go-to-line', line: number, column?: number): void
}>()

// Parse console output into structured errors when possible
const structuredErrors = computed(() => {
  if (!props.consoleOutput) return [];

  // Always try to parse errors, even if there are success messages mixed in
  // filter out purely success messages later
  const headerOffset = getHeaderLineOffset(usesAnyTextures(props.shaderCode));
  const errors = parseWebGPUErrors(props.consoleOutput, headerOffset);

  // Return structured errors if we found any meaningful ones
  return errors.filter(e => e.message && e.message.length > 0);
});

// Check if a line is a status/informational message
function isStatusMessage(text: string): boolean {
  const trimmedText = text.trim();
  return trimmedText.includes('Detected shader type') ||
         trimmedText.includes('Shader compiled') ||
         trimmedText.includes('Successfully') ||
         trimmedText.includes('Initializing');
}

// Extract status/informational messages to always show above the line
const statusOutput = computed(() => {
  if (!props.consoleOutput) return '';

  // Extract lines that are status/informational
  const lines = props.consoleOutput.split('\n');
  const statusLines = lines.filter(line => {
    const trimmedLine = line.trim();
    return trimmedLine &&
           (trimmedLine.includes('Detected shader type') ||
            trimmedLine.includes('Shader compiled') ||
            trimmedLine.includes('Successfully') ||
            trimmedLine.includes('Initializing'));
  });

  return statusLines.join('\n');
});

// Helper to identify compilation errors in console text
// Parse console output for line references - keep it simple
const tokens = computed(() => {
  const out: Array<{ kind: 'text'; text: string } | { kind: 'line'; num: number }> = [];

  if (!props.consoleOutput) return out;

  // Get the header offset for adjusting compilation error line numbers
  const headerOffset = getHeaderLineOffset(usesAnyTextures(props.shaderCode));

  // Simple approach: just parse the console output for line number links
  // Don't try to enhance error messages here
  const re = /\b(?:Line\s*[:#]?\s*(\d+)|L(\d+))\b/gi;
  let lastIndex = 0;
  let m: RegExpExecArray | null;

  while ((m = re.exec(props.consoleOutput)) !== null) {
    if (m.index > lastIndex) {
      out.push({ kind: 'text', text: props.consoleOutput.slice(lastIndex, m.index) });
    }

    const originalLine = Number(m[1] ?? m[2]);

    // TODO: revisit
    // Determine if this is a compilation error that needs line adjustment
    // Look for WebGPU compilation error patterns vs Monaco syntax errors
    const contextStart = Math.max(0, m.index - 100);
    const contextEnd = Math.min(props.consoleOutput.length, m.index + 100);
    const context = props.consoleOutput.slice(contextStart, contextEnd);

    // Compilation errors from WebGPU typically contain these patterns
    const isCompilationError = context.includes('compilation') ||
                              context.includes('shader failed') ||
                              context.includes('Invalid') ||
                              context.includes('error:') ||
                              (originalLine > headerOffset); // If line number is beyond header, likely compilation error

    // Syntax errors from Monaco typically appear as "Syntax error at line X" with lower line numbers
    const isSyntaxError = context.includes('Syntax error') ||
                         context.includes('Expected') ||
                         (originalLine <= headerOffset && !isCompilationError);

    // Adjust line number for compilation errors only
    let adjustedLine = originalLine;
    if (isCompilationError && !isSyntaxError) {
      adjustedLine = Math.max(1, originalLine - headerOffset);
    }

    out.push({ kind: 'line', num: adjustedLine });
    lastIndex = re.lastIndex;
  }

  if (lastIndex < props.consoleOutput.length) {
    out.push({ kind: 'text', text: props.consoleOutput.slice(lastIndex) });
  }

  return out;
});
</script>

<style scoped>
/* Force console card to be a flex container with proper height */
.panel-console {
  height: 100% !important;
  display: flex !important;
  flex-direction: column !important;
  min-height: 0;
  min-width: 0;
}

/* Override Naive UI card styles */
.panel-console :deep(.n-card) {
  height: 100% !important;
  display: flex !important;
  flex-direction: column !important;
}

.panel-console :deep(.n-card__content) {
  display: flex !important;
  flex-direction: column !important;
  flex: 1 !important;
  min-height: 0 !important;
  overflow: hidden !important;
  padding: 12px !important;
}

/* Console content with proper scrolling */
.console-content {
  flex: 1 !important;
  padding-bottom: 16px;
  max-width: 100%;      /* ensure content doesn't exceed panel width */
}

/* Non-error output styling */
.non-error-output {
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  color: #888;
  font-size: 0.9em;
}
.console-pre {
  margin: 0;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
               "Liberation Mono", "Courier New", monospace;
  white-space: pre-wrap;        /* keep newlines/indentation, allow wrapping */
  word-break: break-word;       /* avoid horizontal scroll on long tokens */
  overflow-wrap: break-word;    /* additional word breaking for long strings */
  font-variant-ligatures: none; /* no confusing 'fi'/'fl' ligatures etc. */
  tab-size: 2;
  max-width: 100%;              /* ensure it doesn't exceed container width */
}

.line-link {
  background: none;
  border: 0;
  padding: 0 2px;
  cursor: pointer;
  text-decoration: underline;
  color: #4080ff;
  flex-shrink: 0;
}

.line-link:hover {
  background-color: rgba(64, 128, 255, 0.1);
}

/* Error styling */
.structured-errors .error-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 8px 0;
  padding: 12px;
  border-radius: 6px;
  border-left: 4px solid;
  background-color: rgba(255, 99, 99, 0.15);
  border-left-color: #ff6363;
}

.error-item .line-link {
  font-weight: 500;
  color: inherit;
  opacity: 0.8;
}

.error-item .line-link:hover {
  opacity: 1;
  background-color: transparent;
}

.structured-errors {
  padding: 4px 0;
}

.error-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.error-message {
  padding-left: 16px;
  font-family: 'Monaco', 'Consolas', monospace;
  font-size: 12px;
  color: #ccc;
  line-height: 1.4;
  word-break: break-word;       /* break long words */
  overflow-wrap: break-word;    /* additional word breaking */
  max-width: 100%;              /* ensure it doesn't exceed container width */
}

/* Compilation error styling for raw console output */
.compilation-error {
  background-color: rgba(255, 99, 99, 0.1);
  border-left: 3px solid #ff6363;
  padding: 4px 8px;
  margin: 2px 0;
  border-radius: 4px;
  display: block;
  line-height: 1.4;
  word-break: break-word;       /* break long words */
  overflow-wrap: break-word;    /* additional word breaking */
  max-width: 100%;              /* ensure it doesn't exceed container width */
}
</style>