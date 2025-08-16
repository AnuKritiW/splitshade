/**
 * WebGPU Shader Renderer
 *
 * Core rendering engine that compiles and executes WGSL shaders with WebGPU.
 * Manages the complete rendering pipeline including:
 * - Shader compilation with header injection
 * - Texture binding and uniform buffer management
 * - Vertex buffer setup for custom geometry
 * - Render loop with time and resolution uniforms
 * - Comprehensive error handling and reporting
 */

import { parseWGSL, parseErrorMessages } from './parser';
import { loadDefaultTexture, usesAnyTextures } from './textures';
import { getWebGPUDevice, configureCanvasContext } from './context';
import { fullscreenVertexWGSL, injectedHeader, minimalHeader, compileShaderModule } from './shaders';
import { createUniforms } from './uniforms';
import { createPipeline } from './pipeline';

/** Current animation frame ID for render loop cancellation */
let currentFrameId: number | null = null;
/** Current cleanup function for resource disposal */
let currentCleanup: (() => void) | null = null;

/**
 * Cancels the current render loop and performs cleanup.
 * 
 * Stops the active animation frame and executes any pending cleanup operations.
 * Used internally to prevent multiple render loops from running simultaneously.
 */
function cancelCurrentRenderLoop() {
  if (currentFrameId !== null) {
    cancelAnimationFrame(currentFrameId);
    currentFrameId = null;
  }

  // ensure ResizeObserver is disconnected before a new one is started
  if (currentCleanup) {
    currentCleanup();
    currentCleanup = null;
  }
}

/**
 * Executes a single render pass with the provided pipeline and resources.
 *
 * @param device - WebGPU device for command encoding
 * @param context - Canvas context for rendering target
 * @param pipeline - Compiled render pipeline
 * @param bindGroup - Resource bindings (textures, uniforms)
 * @param timeBuffer - Buffer containing time uniform data
 * @param vertexBuffer - Optional vertex buffer for custom geometry
 * @param vertexCount - Number of vertices to render (if using vertex buffer)
 */
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

/**
 * Initializes WebGPU and starts rendering the provided shader code.
 *
 * This is the main entry point for shader compilation and rendering.
 * Handles the complete pipeline from shader compilation to render loop setup.
 *
 * @param canvas - HTML canvas element to render to
 * @param shaderCode - WGSL fragment shader source code
 * @param selectedTextures - Texture URLs mapped to iChannel slots
 * @param onConsoleOutput - Optional callback for compilation/runtime messages
 * @param onStructuredErrors - Optional callback for detailed error information
 * @param vertexData - Optional vertex buffer data for custom geometry
 *
 * @remarks
 * - Automatically cancels any previous render loop
 * - Injects appropriate headers based on texture usage
 * - Sets up continuous render loop with time and resolution uniforms
 * - Handles canvas resizing automatically
 * - Reports errors through both console and structured error callbacks
 */
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
  onStructuredErrors?: (errors: Array<{
    message: string;
    line: number;
    column: number;
    type: string;
    offset: number;
    length: number;
  }>) => void,
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

    // Set initial canvas size with device pixel ratio
    const updateCanvasSize = () => {
      const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1; // fallback to 1 for tests
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
    };

    updateCanvasSize();

    // Add resize observer for responsive canvas resizing (only in browser environment)
    let cleanup: (() => void) | null = null;
    if (typeof window !== 'undefined' && 'ResizeObserver' in window) {
      const resizeObserver = new ResizeObserver(updateCanvasSize);
      resizeObserver.observe(canvas);
      cleanup = () => resizeObserver.disconnect();
      currentCleanup = cleanup;
    }

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

    // Handle parser errors as structured errors
    if (!parsedCode.valid) {
      const errorMessage = parsedCode.message || parsedCode.error || 'Invalid shader.';

      // extract line number from parser error message
      const parsedErrors = parseErrorMessages(errorMessage, 0);

      if (parsedErrors.length > 0) {
        // convert ParsedError to the expected structured error format
        const structuredErrors = parsedErrors.map(error => ({
          message: error.message,
          line: error.line,
          column: error.column || 0,
          type: error.type || 'error',
          offset: 0,
          length: 0
        }));
        onStructuredErrors?.(structuredErrors);
      } else {
        // fallback for un-parseable errors
        const parserError = {
          message: errorMessage,
          line: 1,
          column: 0,
          type: 'error',
          offset: 0,
          length: 0
        };
        onStructuredErrors?.([parserError]);
      }
      return;
    }

    if (!parsedCode.entryPoints || Object.values(parsedCode.entryPoints).every(arr => !arr?.length))
      return console.error("No entry points found in shader code.");

    output(`Detected shader type: ${parsedCode.type}`);
    parsedCode.warnings?.forEach(output);

    // Check if shader uses any textures for optimization
    const needsTextures = usesAnyTextures(shaderCode);
    // output(needsTextures ? 'Textures detected: allocating all 4 channels' : 'No textures detected: optimized allocation');
    let fullShaderCode = (needsTextures ? injectedHeader : minimalHeader) + '\n' + shaderCode;

    let vertexEntry = "main";
    const fragmentEntry = parsedCode.entryPoints.fragment[0].name;

    let vertexModule: GPUShaderModule | null = null;
    let fragmentModule: GPUShaderModule | null = null;
    let shaderModule: GPUShaderModule | null = null;

    if (parsedCode.type === "vertex-fragment") {
      vertexEntry = parsedCode.entryPoints.vertex[0].name;
      const compilationResult = await compileShaderModule(device, fullShaderCode);
      if (!compilationResult.module) {
        if (onStructuredErrors) onStructuredErrors(compilationResult.errors);
        return;
      }

      shaderModule = compilationResult.module;
      vertexModule = shaderModule;
      fragmentModule = shaderModule;

      if (onStructuredErrors) onStructuredErrors(compilationResult.errors);

    } else {
      const vertexResult = await compileShaderModule(device, fullscreenVertexWGSL);
      if (!vertexResult.module) {
        if (onStructuredErrors) onStructuredErrors(vertexResult.errors);
        return;
      }
      vertexModule = vertexResult.module;

      const fragmentResult = await compileShaderModule(device, fullShaderCode);
      if (!fragmentResult.module) {
        if (onStructuredErrors) onStructuredErrors(fragmentResult.errors);
        return;
      }
      fragmentModule = fragmentResult.module;

      // Combine errors from both compilations
      if (onStructuredErrors) {
        const allErrors = [...vertexResult.errors, ...fragmentResult.errors];
        onStructuredErrors(allErrors);
      }
    }

    if (!selectedTextures.iChannel0) return output("No texture provided for iChannel0");

    let textureBindings: ({ textureView: GPUTextureView; sampler: GPUSampler; } | null)[] = [];

    if (needsTextures) {
      textureBindings = await Promise.all(
        [selectedTextures.iChannel0, selectedTextures.iChannel1, selectedTextures.iChannel2, selectedTextures.iChannel3].map(async (src) => {
          if (!src) return null;
          return await loadDefaultTexture(device, src);
        })
      );
    }

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
    if (error) {
      const runtimeError = {
        message: `WebGPU Runtime Error: ${error.message}`,
        line: 1, // Runtime errors don't have specific line info
        column: 0,
        type: 'error',
        offset: 0,
        length: 0
      };
      onStructuredErrors?.([runtimeError]);
    } else {
      output(`Shader compiled and executed successfully.`);
    }

  } catch (err: any) {
    const exceptionError = {
      message: `Caught Exception: ${err.message || err}`,
      line: 1,
      column: 0,
      type: 'error',
      offset: 0,
      length: 0
    };
    onStructuredErrors?.([exceptionError]);
  }
}
