import { describe, it, expect, vi, beforeEach } from 'vitest';

import * as context from '@/core/context';
import * as uniforms from '@/pipeline/uniforms';
import * as textures from '@/resources/textures';
import { initWebGPU } from '@/runtime/renderer';
import * as shaders from '@/shader/shaderUtils';
import { fullscreenVertexWGSL } from '@/shader/shaderUtils';
import * as parser from '@/shader/wgslReflect';

describe('renderer.ts', () => {
  const mockCanvas = {
    width: 0,
    height: 0,
    clientWidth: 100,
    clientHeight: 100,
    addEventListener: vi.fn(),
  } as unknown as HTMLCanvasElement;

  const mockDevice = {
    createBuffer: vi.fn().mockReturnValue({
      getMappedRange: () => new ArrayBuffer(4 * 6),
      unmap: vi.fn()
    }),
    queue: {
      writeBuffer: vi.fn(),
      submit: vi.fn()
    },
    createCommandEncoder: vi.fn().mockReturnValue({
      beginRenderPass: vi.fn().mockReturnValue({
        setPipeline: vi.fn(),
        setBindGroup: vi.fn(),
        setVertexBuffer: vi.fn(),
        draw: vi.fn(),
        end: vi.fn()
      }),
      finish: vi.fn()
    }),
    createPipelineLayout: vi.fn().mockReturnValue({}),
    createRenderPipeline: vi.fn().mockReturnValue({}),
    pushErrorScope: vi.fn(),
    popErrorScope: vi.fn().mockResolvedValue(null)
  } as unknown as GPUDevice;

  const mockContext = {
    getCurrentTexture: () => ({
      createView: () => ({}),
    }),
  } as unknown as GPUCanvasContext;

  // reset and rewire all mocks before each test
  beforeEach(() => {
    vi.clearAllMocks();

    // stub browser APIs
    vi.stubGlobal('performance', { now: () => 0 });

    // avoid infinite render loop
    vi.stubGlobal('requestAnimationFrame', () => 1);
    vi.stubGlobal('cancelAnimationFrame', vi.fn());

    // mock WebGPU setup from context module
    vi.spyOn(context, 'getWebGPUDevice').mockResolvedValue({
      device: mockDevice,
      adapter: {},
    } as any);

    vi.spyOn(context, 'configureCanvasContext').mockReturnValue({
      context: mockContext,
      format: 'bgra8unorm',
    });

    // mock result of shader parsing (valid fragment entry point)
    const mockFunctionInfo = {
      name: 'main',
      stage: 'fragment',
      inputs: [],
      outputs: [],
      arguments: [],
      returnType: null,
      attributes: [],
      usedBuiltins: [],
      usedGlobals: [],
      workgroupSize: [1, 1, 1],
      resources: [],
      overrides: [],
      startLine: 0,
      endLine: 0,
      inUse: true,
      calls: new Set<any>(),
    };

    vi.spyOn(parser, 'parseWGSL').mockReturnValue({
      type: 'fragment',
      valid: true,
      entryPoints: {
        vertex: [],
        fragment: [mockFunctionInfo],
        compute: []
      },
      warnings: [],
    });

    // replace shader source and shader compilation
    vi.spyOn(shaders, 'fullscreenVertexWGSL', 'get').mockReturnValue(fullscreenVertexWGSL);
    vi.spyOn(shaders, 'compileShaderModule').mockResolvedValue({
      module: {} as GPUShaderModule,
      errors: [],
      hasErrors: false
    });

    // mock uniform buffer creation
    vi.spyOn(uniforms, 'createUniforms').mockReturnValue({
      bindGroupLayout: {} as unknown as GPUBindGroupLayout,
      bindGroup: {} as unknown as GPUBindGroup,
      timeBuffer: {} as unknown as GPUBuffer,
      startTime: 0,
      mouseBuffer: {} as unknown as GPUBuffer,
    });

    // mock texture loading
    vi.spyOn(textures, 'loadDefaultTexture').mockResolvedValue({
      textureView: {} as GPUTextureView,
      sampler: {} as GPUSampler,
    });

  });

  // Test: Valid shader + texture = successful render
  it('should initialize and render with valid shader and texture', async () => {
    const logSpy = vi.fn();

    await initWebGPU(mockCanvas, 'valid shader', {
      iChannel0: 'image.png',
      iChannel1: null,
      iChannel2: null,
      iChannel3: null,
    }, logSpy);

    expect(context.getWebGPUDevice).toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Shader compiled and executed successfully'));
  });

  // Test: if missing iChannel0 texture, early return with error
  it('should log error if iChannel0 texture is missing', async () => {
    const logSpy = vi.fn();

    await initWebGPU(mockCanvas, 'valid shader', {
      iChannel0: null,
      iChannel1: null,
      iChannel2: null,
      iChannel3: null,
    }, logSpy);

    expect(logSpy).toHaveBeenCalledWith('No texture provided for iChannel0');
  });

  // Test: if invalid shader, error log
  it('should handle invalid shader errors through structured errors', async () => {
    vi.spyOn(parser, 'parseWGSL').mockReturnValue({
      type: 'fragment',
      valid: false,
      message: 'Shader compilation failed',
    });

    const logSpy = vi.fn();
    const structuredErrorsSpy = vi.fn();

    await initWebGPU(mockCanvas, 'invalid shader', {
      iChannel0: 'image.png',
      iChannel1: null,
      iChannel2: null,
      iChannel3: null,
    }, logSpy, structuredErrorsSpy);

    expect(structuredErrorsSpy).toHaveBeenCalledWith([{
      message: 'compilation failed',
      line: 1,
      column: 0,
      type: 'error',
      offset: 0,
      length: 0
    }]);
  });

  it('logs error if no entry points are found', async () => {
    vi.spyOn(parser, 'parseWGSL').mockReturnValue({
      type: 'fragment',
      valid: true,
      entryPoints: {
        vertex: [],
        fragment: [],
        compute: []
      },
      warnings: [],
    });

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await initWebGPU(mockCanvas, 'shader with no entry points', {
      iChannel0: 'image.png',
      iChannel1: null,
      iChannel2: null,
      iChannel3: null,
    }, vi.fn());

    expect(errorSpy).toHaveBeenCalledWith('No entry points found in shader code.');
  });
});
