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

// TODO: clean up
// TODO: check where we are logging direct to console versus output()
export async function initWebGPU(
  canvas: HTMLCanvasElement,
  shaderCode: string,
  onConsoleOutput?: (msg: string) => void
) {
  console.log("Initializing WebGPU...");

  const output = (msg: string) => {
    if (onConsoleOutput) onConsoleOutput(msg); // log to browser console
    console.log(msg);                          // always log to inspect console
  };

  try {
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

    // Compile fragment and hardcoded vertex shader
    const vertexModule = device.createShaderModule({
      code: fullscreenVertexWGSL,
    });
    const fragmentModule = device.createShaderModule({
      code: shaderCode,
    });

    // Get diagnostic info
    const info = await fragmentModule.getCompilationInfo();
    if (info.messages.length > 0) {
      const formatted = info.messages.map(m => {
        const where = `L${m.lineNum}:${m.linePos}`;
        return `[${m.type}] ${where} ${m.message}`;
      }).join("\n");
      output(formatted);
      if (info.messages.some(m => m.type === "error")) return; // Abort if errors
    }

    // catch any validation errors that happen in this scope
    // this is useful for catching shader compilation errors
    // collect them to check later with popErrorScope()
    device.pushErrorScope('validation');

    // Create render pipeline using fullscreen triangle
    const pipeline = device.createRenderPipeline({
      layout: "auto",
      vertex: {
        module: vertexModule,
        entryPoint: "main",
      },
      fragment: {
        module: fragmentModule,
        entryPoint: parsedCode.entryPoints[0].name,
        targets: [{ format }],
      },
      primitive: {
        topology: "triangle-list",
      },
    });

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
    pass.draw(3); // Fullscreen triangle
    pass.end();

    device.queue.submit([encoder.finish()]);

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
