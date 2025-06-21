export async function initWebGPU(canvas: HTMLCanvasElement) {
  console.log("Initializing WebGPU...");

  if (!navigator.gpu) {
    console.error("WebGPU not supported.");
    return;
  }

  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) {
    console.error("Failed to get GPU adapter");
    return;
  }

  const device = await adapter.requestDevice();
  console.log("Got GPU device:", device);

  const context = canvas.getContext("webgpu") as GPUCanvasContext;
  const format = navigator.gpu.getPreferredCanvasFormat();

  context.configure({
    device,
    format,
    alphaMode: "opaque",
  });

  const encoder = device.createCommandEncoder();
  const pass = encoder.beginRenderPass({
    colorAttachments: [{
      view: context.getCurrentTexture().createView(),
      clearValue: { r: 0.1, g: 0.1, b: 0.1, a: 1.0 },
      loadOp: "clear",
      storeOp: "store",
    }],
  });
  pass.end();

  device.queue.submit([encoder.finish()]);
  console.log("Submitted WebGPU draw call");
}
