import { parseWGSL } from './parser';
import { loadDefaultTexture } from './textures';
import { getWebGPUDevice, configureCanvasContext } from './context';
import { fullscreenVertexWGSL, injectedHeader, compileShaderModule } from './shaders';
import { createUniforms } from './uniforms';
import { createPipeline } from './pipeline';

let currentFrameId: number | null = null;

// Cancel any active render loop
export function cancelCurrentRenderLoop() {
  if (currentFrameId !== null) {
    cancelAnimationFrame(currentFrameId);
    currentFrameId = null;
  }
}

function runRenderPass(
  device: GPUDevice,
  context: GPUCanvasContext,
  pipeline: GPURenderPipeline,
  bindGroup: GPUBindGroup,
  timeBuffer: GPUBuffer,
  startTime: number,
  vertexBuffer: GPUBuffer | null = null,
  vertexData: Float32Array | null = null
) {
  // Encode commands
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
  pass.setBindGroup(0, bindGroup); // injects iResolution uniform
  if (vertexBuffer && vertexData) {
    pass.setVertexBuffer(0, vertexBuffer)
    pass.draw(vertexData.length / 6, 1, 0, 0) // 6 floats per vertex (vec3 pos + vec3 color)
  } else {
    pass.draw(3, 1, 0, 0) // Fullscreen triangle fallback
  }
  // pass.draw(3); // Fullscreen triangle
  pass.end();

  const elapsed = (performance.now() - startTime) / 1000.0;
  device.queue.writeBuffer(timeBuffer, 0, new Float32Array([elapsed]));

  device.queue.submit([encoder.finish()]);
}

// TODO: check where we are logging direct to console versus output()
export async function initWebGPU(
  canvas: HTMLCanvasElement,
  shaderCode: string,
  selectedTextures: {
    iChannel0: string | null;
    iChannel1: string | null;
    iChannel2: string | null;
    iChannel3: string | null;
  },
  onConsoleOutput?: (msg: string) => void,
  vertexData: Float32Array | null = null
) {
  const output = (msg: string) => {
    if (onConsoleOutput) onConsoleOutput(msg); // log to browser console
    console.log(msg);                          // always log to inspect console
  };

  console.log("Initializing WebGPU...");
  cancelCurrentRenderLoop(); // stop any previous render loop

  try {
    const { device, adapter } = await getWebGPUDevice();
    if (!device || !adapter) return;

    let vertexBuffer: GPUBuffer | null = null

    if (vertexData) {
      vertexBuffer = device.createBuffer({
        size: vertexData.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        mappedAtCreation: true
      })

      const arrayBuffer = vertexBuffer.getMappedRange()
      new Float32Array(arrayBuffer).set(vertexData)
      vertexBuffer.unmap()
    }

    const { context, format } = configureCanvasContext(canvas, device);

    canvas.width = canvas.clientWidth * window.devicePixelRatio;
    canvas.height = canvas.clientHeight * window.devicePixelRatio;

    const mouse = { x: 0, y: 0, down: false };

    canvas.addEventListener("mousemove", (e) => {
      const rect = canvas.getBoundingClientRect();
      const scale = window.devicePixelRatio;
      mouse.x = (e.clientX - rect.left) * scale;
      mouse.y = (e.clientY - rect.top) * scale;
    });

    canvas.addEventListener("mousedown", () => { mouse.down = true; });
    canvas.addEventListener("mouseup", () => { mouse.down = false; });

    const parsedCode = parseWGSL(shaderCode);
    output(`Detected shader type: ${parsedCode.type}`);

    // log the most relevant error message
    if (!parsedCode.valid) return output(parsedCode.message || parsedCode.error || 'Invalid shader.');
    parsedCode.warnings?.forEach(output);

    if (!parsedCode.entryPoints || Object.values(parsedCode.entryPoints).every(arr => !arr?.length))
      return console.error("No entry points found in shader code.");

    let fullShaderCode = injectedHeader + '\n' + shaderCode;

    let vertexEntry = "main";
    const fragmentEntry = parsedCode.entryPoints.fragment[0].name;

    let vertexModule: GPUShaderModule | null = null;
    let fragmentModule: GPUShaderModule | null = null;
    let shaderModule: GPUShaderModule | null = null;

    if (parsedCode.type === "vertex-fragment") {
      vertexEntry = parsedCode.entryPoints.vertex[0].name;
      shaderModule = await compileShaderModule(device, fullShaderCode, output);
      if (!shaderModule) return;

      vertexModule = shaderModule;
      fragmentModule = shaderModule;

    } else {
      vertexModule = await compileShaderModule(device, fullscreenVertexWGSL, output);
      if (!vertexModule) return;

      fragmentModule = await compileShaderModule(device, fullShaderCode, output);
      if (!fragmentModule) return;
    }

    if (!selectedTextures.iChannel0) return output("No texture provided for iChannel0");

    const textureBindings = await Promise.all(
      [selectedTextures.iChannel0, selectedTextures.iChannel1, selectedTextures.iChannel2, selectedTextures.iChannel3].map(async (src) => {
        if (!src) return null;
        return await loadDefaultTexture(device, src);
      })
    );

    // Create iResolution uniform (vec3<f32>: width, height, 1.0)
    // Create iTime uniform (f32: 0.0)
    const { bindGroupLayout, bindGroup, timeBuffer, startTime, mouseBuffer } = createUniforms(device, canvas, textureBindings);

    // catch any validation errors that happen in this scope
    // this is useful for catching shader compilation errors
    // collect them to check later with popErrorScope()
    device.pushErrorScope('validation');

    const pipelineLayout = device.createPipelineLayout({
      bindGroupLayouts: [bindGroupLayout],
    });
    const pipeline = createPipeline(
      device,
      vertexModule,
      fragmentModule,
      fragmentEntry,
      format,
      pipelineLayout,
      vertexEntry,
      !!vertexData // boolean flag to toggle vertex input
    );

    function frame() {
      if (!device) return;

      const elapsed = (performance.now() - startTime) / 1000.0;
      device.queue.writeBuffer(timeBuffer, 0, new Float32Array([elapsed]));

      const mouseVec4 = new Float32Array([
        mouse.x,
        mouse.y,
        mouse.down ? 1.0 : 0.0,
        0.0 // padding for vec4
      ]);
      device.queue.writeBuffer(mouseBuffer, 0, mouseVec4);

      runRenderPass(device, context, pipeline, bindGroup, timeBuffer, startTime, vertexBuffer, vertexData);
      currentFrameId = requestAnimationFrame(frame);
    }
    currentFrameId = requestAnimationFrame(frame);

    // Pop error scope
    const error = await device.popErrorScope();
    if (error) output(`WebGPU Error: ${error.message}`);
    else output(`Shader compiled and executed successfully.`);

  } catch (err: any) {
    output(`Caught Exception: ${err.message || err}`);
  }
}
