import redTriangleWGSL from './shaders/redTriangle.wgsl?raw';

export async function initWebGPU(
  canvas: HTMLCanvasElement,
  shaderCode: string,
  onConsoleOutput?: (msg: string) => void
) {
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
  if (!device) {
    console.error("Failed to get GPU device");
    return;
  }
  console.log("Got GPU device:", device);

  const context = canvas.getContext("webgpu") as GPUCanvasContext;
  const format = navigator.gpu.getPreferredCanvasFormat();

  context.configure({
    device,
    format,
    alphaMode: "opaque",
  });

  const shaderModule = device.createShaderModule({
    code: shaderCode,
  });

  // Get diagnostic info
  const info = await shaderModule.getCompilationInfo();
  if (info.messages.length > 0) {
    const formatted = info.messages.map(m => {
      const where = `L${m.lineNum}:${m.linePos}`;
      return `[${m.type}] ${where} ${m.message}`;
    }).join("\n");
    onConsoleOutput?.(formatted);
    if (info.messages.some(m => m.type === "error")) return; // Abort if errors
  }

  const pipeline = device.createRenderPipeline({
    layout: "auto",
    vertex: {
      module: shaderModule,
      entryPoint: "vs_main",
    },
    fragment: {
      module: shaderModule,
      entryPoint: "fs_main",
      targets: [{ format }],
    },
    primitive: {
      topology: "triangle-list",
    },
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

  pass.setPipeline(pipeline);
  pass.draw(3); // 3 verts to make 1 triangle
  pass.end();

  device.queue.submit([encoder.finish()]);
  console.log("Submitted WebGPU draw call");
}
