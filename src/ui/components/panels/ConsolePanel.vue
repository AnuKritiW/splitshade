<!--
  SPDX-License-Identifier: GPL-3.0-only

  SplitShade: WebGPU Playground
  Copyright (C) 2025 Anu Kriti Wadhwa

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, version 3 of the License.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with this program.  If not, see <https://www.gnu.org/licenses/>.
-->
<template>
  <!-- Console (bottom-right) -->
  <n-card title="Console" size="small" class="panel-console" style="grid-row: 2; grid-column: 2;">
    <n-scrollbar style="max-height: 100%;">
      <div class="console-content">
      <!-- Manual output() messages (above the line) -->
      <div v-if="consoleOutput" class="console-pre non-error-output">
        {{ consoleOutput }}
      </div>

      <!-- System-generated errors from WebGPU (below the line) -->
      <div v-if="structuredErrors.length > 0" class="structured-errors">
        <div
v-for="(error, index) in structuredErrors" :key="index"
             class="error-item"
             :class="{
               'error-type-error': error.type === 'error',
               'error-type-warning': error.type === 'warning',
               'error-type-info': error.type === 'info'
             }"
>
          <div class="error-header">
            <n-tag
              :type="error.type === 'error' ? 'error' : error.type === 'warning' ? 'warning' : 'info'"
              size="small"
            >
              {{ error.type?.toUpperCase() || 'ERROR' }}
            </n-tag>
            <button
              class="line-link"
              type="button"
              :title="`Jump to line ${error.line}${error.column ? `, column ${error.column}` : ''}`"
              @click="emit('go-to-line', error.line, error.column)"
            >
              Line {{ error.line }}{{ error.column ? `:${error.column}` : '' }}
            </button>
          </div>
          <div class="error-message">{{ error.message }}</div>
        </div>
      </div>
    </div>
    </n-scrollbar>
  </n-card>
</template>

<script setup lang="ts">
/**
 * ConsolePanel Component
 *
 * Displays shader compilation output and structured error information.
 * Provides two types of output:
 * - Manual output messages (compilation success, info logs)
 * - Structured errors from WebGPU with clickable line navigation
 *
 * Errors are displayed with severity badges and clickable line numbers
 * that allow users to jump directly to problematic code in the editor.
 */

import { computed } from 'vue';

const props = defineProps<{
  /** Raw console output text from shader compilation */
  consoleOutput: string;
  /** Current shader code (currently unused, reserved for future features) */
  shaderCode?: string;
  /** Structured error objects from WebGPU compilation with location data */
  structuredErrors?: Array<{
    /** Human-readable error message */
    message: string;
    /** Line number where error occurred */
    line: number;
    /** Column number where error occurred */
    column: number;
    /** Error severity (error, warning, info) */
    type: string;
    /** Character offset in source code */
    offset: number;
    /** Length of problematic code section */
    length: number;
  }>;
}>();

const emit = defineEmits<{
  /** Request to navigate editor to specific line/column */
  'go-to-line': [line: number, column?: number]
}>()

/** Computed property that safely accesses structured errors with fallback */
const structuredErrors = computed(() => {
  return props.structuredErrors || [];
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
}

/* Error type specific styling */
.error-type-error {
  background-color: rgba(255, 99, 99, 0.15);
  border-left-color: #ff6363;
}

.error-type-warning {
  background-color: rgba(255, 193, 7, 0.15);
  border-left-color: #ffc107;
}

.error-type-info {
  background-color: rgba(23, 162, 184, 0.15);
  border-left-color: #17a2b8;
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
  white-space: pre-wrap;        /* preserve line breaks and spacing */
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