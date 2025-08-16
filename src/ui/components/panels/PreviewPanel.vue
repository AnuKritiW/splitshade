<!--
/**
 * PreviewPanel Component
 *
 * WebGPU rendering canvas for displaying compiled shader output.
 * Provides the visual preview area where fragment shaders are rendered
 * in real-time within the shader playground interface.
 *
 * @component
 */
-->
<template>
  <n-card title="Preview" size="small" class="panel" style="grid-row: 1; grid-column: 2;">
    <canvas id="gfx" ref="canvasRef" style="width: 100%; height: 100%;" />
  </n-card>
</template>

<script setup lang="ts">
import { ref } from 'vue'

/**
 * Canvas element reference for WebGPU rendering.
 *
 * Provides direct access to the HTML canvas element where
 * fragment shaders are rendered by the WebGPU context.
 */
const canvasRef = ref<HTMLCanvasElement | null>(null)

/**
 * Exposed component interface.
 *
 * Exposes the canvas reference to parent components for
 * WebGPU context initialization and rendering setup.
 */
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