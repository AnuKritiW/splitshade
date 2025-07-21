<template>
  <n-card title="Preview" size="small" class="panel" style="grid-row: 1; grid-column: 2;">
    <canvas ref="canvasRef" id="gfx" style="width: 100%; height: 100%;"></canvas>
  </n-card>
</template>

<script setup lang="ts">
import { defineExpose, ref } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)

defineExpose({
  canvasRef
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

canvas {
  display: block;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
}
</style>