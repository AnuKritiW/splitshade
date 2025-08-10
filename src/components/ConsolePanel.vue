<template>
  <!-- Console (bottom-right) -->
  <n-card title="Console" size="small" class="panel panel-console" style="grid-row: 2; grid-column: 2;">
    <div class="console-content">
      <pre class="console-pre">{{ consoleOutput }}</pre>
    </div>
  </n-card>
</template>

<script setup lang="ts">
defineProps<{
  consoleOutput: string
}>()
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
</style>