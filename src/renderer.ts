import { parseWGSL } from './webgpu/parser';

const fullscreenVertexWGSL = `
@vertex
fn main(@builtin(vertex_index) vertexIndex : u32) -> @builtin(position) vec4<f32> {
  var pos = array<vec2<f32>, 3>(
    vec2<f32>(-1.0, -3.0),
    vec2<f32>(3.0, 1.0),
    vec2<f32>(-1.0, 1.0)
  );
  return vec4<f32>(pos[vertexIndex], 0.0, 1.0);
}
`;

async function getWebGPUDevice() {
  if (!navigator.gpu) {
    console.error("WebGPU not supported.");
    return { device: null, adapter: null };
  }

  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) {
    console.error("Failed to get GPU adapter");
    return { device: null, adapter: null };
  }

  const device = await adapter.requestDevice();
  if (!device) {
    console.error("Failed to get GPU device");
    return { device: null, adapter: null };
  }

  console.log("Got GPU device:", device);
  return { device, adapter };
}

function configureCanvasContext(canvas: HTMLCanvasElement, device: GPUDevice) {
  const context = canvas.getContext("webgpu") as GPUCanvasContext;
  const format = navigator.gpu.getPreferredCanvasFormat();
  context.configure({
    device,
    format,
    alphaMode: "opaque",
  });
  return { context, format };
}

async function compileShaderModule(device: GPUDevice, code: string, output: (msg: string) => void) {
  const module = device.createShaderModule({ code });

  // Get diagnostic info
  const info = await module.getCompilationInfo();
  if (info.messages.length > 0) {
    const formatted = info.messages.map(m => {
      const where = `L${m.lineNum}:${m.linePos}`;
      return `[${m.type}] ${where} ${m.message}`;
    }).join("\n");
    output(formatted);
    if (info.messages.some(m => m.type === "error")) return null;
  }
  return module;
}

function createFullscreenPipeline(
  device: GPUDevice,
  vertexModule: GPUShaderModule,
  fragmentModule: GPUShaderModule,
  fragmentEntryPoint: string,
  format: GPUTextureFormat,
  layout: GPUPipelineLayout
) {
  // Create render pipeline using fullscreen triangle
  return device.createRenderPipeline({
    layout,
    vertex: {
      module: vertexModule,
      entryPoint: "main",
    },
    fragment: {
      module: fragmentModule,
      entryPoint: fragmentEntryPoint,
      targets: [{ format }],
    },
    primitive: {
      topology: "triangle-list",
    },
  });
}

function runRenderPass(
  device: GPUDevice,
  context: GPUCanvasContext,
  pipeline: GPURenderPipeline,
  bindGroup: GPUBindGroup,
  timeBuffer: GPUBuffer,
  startTime: number
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
  pass.draw(3); // Fullscreen triangle
  pass.end();

  const elapsed = (performance.now() - startTime) / 1000.0;
  device.queue.writeBuffer(timeBuffer, 0, new Float32Array([elapsed]));

  device.queue.submit([encoder.finish()]);
}

function createUniforms(device: GPUDevice, canvas: HTMLCanvasElement)
{
  const resolutionData = new Float32Array([
    canvas.width,
    canvas.height,
    1.0,
  ]);

  const timeData = new Float32Array([0.0]); // will update every frame

  const mouseData = new Float32Array([0.0, 0.0, 0.0, 0.0]);

  const resolutionBuffer = device.createBuffer({
    size: resolutionData.byteLength,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  const timeBuffer = device.createBuffer({
    size: timeData.byteLength,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  const mouseBuffer = device.createBuffer({
    size: mouseData.byteLength,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  device.queue.writeBuffer(resolutionBuffer, 0, resolutionData);
  device.queue.writeBuffer(timeBuffer, 0, timeData);
  device.queue.writeBuffer(mouseBuffer, 0, mouseData);

  const bindGroupLayout = device.createBindGroupLayout({
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.FRAGMENT,
        buffer: { type: "uniform" },
      },
      {
        binding: 1,
        visibility: GPUShaderStage.FRAGMENT,
        buffer: { type: "uniform" },
      },
      {
        binding: 2,
        visibility: GPUShaderStage.FRAGMENT,
        buffer: { type: "uniform" },
      }
    ],
  });

  const bindGroup = device.createBindGroup({
    layout: bindGroupLayout,
    entries: [
      { binding: 0, resource: { buffer: resolutionBuffer } },
      { binding: 1, resource: { buffer: timeBuffer } },
      { binding: 2, resource: { buffer: mouseBuffer } },
    ],
  });

  return { bindGroupLayout, bindGroup,
           timeBuffer, startTime: performance.now(), mouseBuffer};
}

// TODO: check where we are logging direct to console versus output()
export async function initWebGPU(
  canvas: HTMLCanvasElement,
  shaderCode: string,
  onConsoleOutput?: (msg: string) => void
) {
  const output = (msg: string) => {
    if (onConsoleOutput) onConsoleOutput(msg); // log to browser console
    console.log(msg);                          // always log to inspect console
  };

  console.log("Initializing WebGPU...");

  try {
    const { device, adapter } = await getWebGPUDevice();
    if (!device || !adapter) return;

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

    if (!parsedCode.valid) {
      // log the most relevant error message
      output(parsedCode.message || parsedCode.error || 'Invalid shader.');
      return;
    }

    if (parsedCode.warnings?.length) {
      parsedCode.warnings.forEach(output);
    }

    if (!parsedCode.entryPoints || parsedCode.entryPoints.length === 0) {
      console.error("No entry points found in shader code.");
      return;
    }

    // Compile fragment and hardcoded vertex shader
    const vertexModule = device.createShaderModule({
      code: fullscreenVertexWGSL,
    });
    const fragmentModule = await compileShaderModule(device, shaderCode, output);
    if (!fragmentModule) return;

    // Create iResolution uniform (vec3<f32>: width, height, 1.0)
    // Create iTime uniform (f32: 0.0)
    const { bindGroupLayout, bindGroup, timeBuffer, startTime, mouseBuffer } = createUniforms(device, canvas);

    // catch any validation errors that happen in this scope
    // this is useful for catching shader compilation errors
    // collect them to check later with popErrorScope()
    device.pushErrorScope('validation');

    const pipelineLayout = device.createPipelineLayout({
      bindGroupLayouts: [bindGroupLayout],
    });
    const pipeline = createFullscreenPipeline(device, vertexModule, fragmentModule, parsedCode.entryPoints[0].name, format, pipelineLayout);

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

      runRenderPass(device, context, pipeline, bindGroup, timeBuffer, startTime);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    // Pop error scope
    const error = await device.popErrorScope();
    if (error) {
      output(`WebGPU Error: ${error.message}`);
    } else {
      output(`Shader compiled and executed successfully.`);
    }

  } catch (err: any) {
    output(`Caught Exception: ${err.message || err}`);
  }
}
