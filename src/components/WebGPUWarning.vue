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

const webgpuSupported = ref(true)

onMounted(() => {
  if (!navigator.gpu) {
    webgpuSupported.value = false
  }
})
</script>
