<template>
  <div id="layout">
    <div id="editor">Editor goes here</div>

    <div id="right-panel">
      <canvas id="gfx"></canvas>
      <div id="console">Console output</div>
    </div>
  </div>
</template>

<style>
#app {
  margin: 0;
  padding: 0;
  max-width: none;
  text-align: left;
}
</style>


<style scoped>
#layout {
  display: flex;
  height: 100vh;
  width: 100vw;
  background: #0e0e0e;
  color: white;
  font-family: sans-serif;
}

#editor {
  width: 50%;
  height: 100%;
  background: #1e1e1e;
  padding: 1rem;
  overflow: auto;
}

#right-panel {
  width: 50%;
  display: flex;
  flex-direction: column;
}

#gfx {
  flex: 3;
  width: 100%;
  background: #111;
}

#console {
  flex: 1;
  padding: 0.5rem;
  background: #202020;
  color: #ddd;
  font-family: monospace;
  font-size: 0.85rem;
  overflow-y: auto;
}
</style>
