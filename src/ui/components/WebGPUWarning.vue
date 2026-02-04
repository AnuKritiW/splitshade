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
