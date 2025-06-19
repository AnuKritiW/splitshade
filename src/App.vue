<script setup lang="ts">
import { darkTheme } from 'naive-ui'
</script>

<template>
  <n-config-provider :theme="darkTheme">
    <n-layout style="height: 100vh">
      <n-layout-header bordered style="padding: 12px;">
        <h2 style="margin: 0; color: white">SplitShade: WebGPU Playground</h2>
      </n-layout-header>

      <n-layout has-sider>
        <n-layout-sider width="50%" bordered content-style="padding: 12px;">
          <n-card title="Editor" size="small">Editor goes here</n-card>
        </n-layout-sider>

        <n-layout>
          <n-layout-content content-style="padding: 12px; height: 75%;">
            <n-card title="Preview" size="small">
              <canvas id="gfx" style="width: 100%; height: 100%;"></canvas>
            </n-card>
          </n-layout-content>

          <n-layout-footer style="padding: 12px; height: 25%;">
            <n-card title="Console" size="small">Console output</n-card>
          </n-layout-footer>
        </n-layout>
      </n-layout>
    </n-layout>
  </n-config-provider>
</template>

<style>
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  overflow: hidden;
}

.n-layout-sider,
.n-layout-footer {
  background-color: #101014;
}
</style>
