<template>
  <!-- Console (bottom-right) -->
  <n-card title="Console" size="small" class="panel panel-console" style="grid-row: 2; grid-column: 2;">
    <div class="console-content">
      <div class="console-pre">
        <template v-for="(t, i) in tokens" :key="i">
          <!-- Line link -->
          <button
            v-if="t.kind === 'line'"
            class="line-link"
            type="button"
            @click="emit('go-to-line', t.num)"
            :title="`Jump to line ${t.num}`"
          >
            L{{ t.num }}
          </button>
          <!-- Plain text -->
          <span v-else>{{ t.text }}</span>
        </template>
      </div>
    </div>
  </n-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { getHeaderLineOffset } from '../webgpu/parser';

const props = defineProps<{
  consoleOutput: string
}>()

const emit = defineEmits<{
  (e: 'go-to-line', line: number): void
}>()

// Parse console output for line references - keep it simple
const tokens = computed(() => {
  const out: Array<{ kind: 'text'; text: string } | { kind: 'line'; num: number }> = [];

  if (!props.consoleOutput) return out;

  // Get the header offset for adjusting compilation error line numbers
  const headerOffset = getHeaderLineOffset();

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
      console.log(`Adjusted compilation error line: ${originalLine} -> ${adjustedLine}`);
    } else {
      console.log(`Keeping syntax error line unchanged: ${originalLine}`);
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
.panel-console {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.panel-console .n-card__content {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.panel-console .console-content {
  flex: 1;
  overflow-y: auto;     /* scroll when it overflows */
  padding-bottom: 16px;
}

.console-pre {
  margin: 0;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
               "Liberation Mono", "Courier New", monospace;
  white-space: pre-wrap;        /* keep newlines/indentation, allow wrapping */
  word-break: break-word;       /* avoid horizontal scroll on long tokens */
  font-variant-ligatures: none; /* no confusing 'fi'/'fl' ligatures etc. */
  tab-size: 2;
}

.line-link {
  background: none;
  border: 0;
  padding: 0 2px;
  cursor: pointer;
  text-decoration: underline;
  color: #4080ff;
}

.line-link:hover {
  background-color: rgba(64, 128, 255, 0.1);
}

/* Error styling */
.error-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 4px 0;
  padding: 8px;
  border-radius: 4px;
  border-left: 3px solid;
}

.error-item.error {
  background-color: rgba(255, 99, 99, 0.1);
  border-left-color: #ff6363;
}

.error-item.warning {
  background-color: rgba(255, 193, 7, 0.1);
  border-left-color: #ffc107;
}

.error-item.info {
  background-color: rgba(23, 162, 184, 0.1);
  border-left-color: #17a2b8;
}

.error-icon {
  flex-shrink: 0;
  font-size: 14px;
}

.error-message {
  flex: 1;
  font-size: 13px;
  line-height: 1.4;
}

.error-item .line-link {
  flex-shrink: 0;
  font-weight: 500;
  color: inherit;
  opacity: 0.8;
}

.error-item .line-link:hover {
  opacity: 1;
}
</style>