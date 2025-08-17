<!--
/**
 * WebGPUWarning Component
 *
 * Browser compatibility warning for WebGPU support detection.
 * Displays an alert message when the user's browser lacks WebGPU
 * capabilities required for shader playground functionality.
 *
 * @component
 */
-->
<template>
  <n-alert
    v-if="!webgpuSupported"
    type="warning"
    title="WebGPU Not Supported"
    style="margin: 12px;"
  >
    Your browser does not support WebGPU. Please use a recent version of Chrome, Edge, or Firefox with WebGPU enabled.
  </n-alert>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

/**
 * Reactive state for WebGPU browser support detection.
 *
 * Tracks whether the current browser environment supports
 * the WebGPU API required for shader compilation and rendering.
 */
const webgpuSupported = ref(true)

/**
 * Lifecycle hook to check WebGPU availability.
 *
 * Detects WebGPU support by checking for the navigator.gpu API.
 * Updates the support state to trigger warning display if needed.
 */
onMounted(() => {
  if (!navigator.gpu) {
    webgpuSupported.value = false
  }
})
</script>
