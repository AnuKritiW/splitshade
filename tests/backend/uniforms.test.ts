import { createUniforms } from '@/webgpu/uniforms';

describe('createUniforms', () => {
  let mockDevice: GPUDevice;
  let mockCanvas: HTMLCanvasElement;

  beforeAll(() => {
    // stub WebGPU global constants needed by createUniforms
    vi.stubGlobal('GPUBufferUsage', {
      UNIFORM: 1,
      COPY_DST: 2,
    });

    vi.stubGlobal('GPUShaderStage', {
      FRAGMENT: 4,
      VERTEX: 8,
    });
  });

  // reset all mocks before each test
  beforeEach(() => {
    vi.restoreAllMocks();

    mockCanvas = { width: 640, height: 480 } as HTMLCanvasElement;

    // dummy GPU objects to return from mocks
    const mockBuffer = {} as GPUBuffer;
    const mockLayout = {} as GPUBindGroupLayout;
    const mockGroup = {} as GPUBindGroup;

    // mock WebGPU device methods used in createUniforms
    mockDevice = {
      createBuffer: vi.fn().mockReturnValue(mockBuffer),
      queue: {
        writeBuffer: vi.fn(),
      },
      createBindGroupLayout: vi.fn().mockReturnValue(mockLayout),
      createBindGroup: vi.fn().mockReturnValue(mockGroup),
    } as unknown as GPUDevice;
  });

  // Test: basic usage with no textures
  it('creates uniform buffers and writes initial data', () => {
    const result = createUniforms(mockDevice, mockCanvas, []);

    // Buffer creation (resolution, time, mouse)
    expect(mockDevice.createBuffer).toHaveBeenCalledTimes(3);
    expect(mockDevice.createBuffer).toHaveBeenCalledWith(
      expect.objectContaining({ usage: expect.any(Number) })
    );

    // ensure data was written to each buffer
    expect(mockDevice.queue.writeBuffer).toHaveBeenCalledTimes(3);

    expect(result).toEqual(
      expect.objectContaining({
        bindGroupLayout: expect.any(Object),
        bindGroup: expect.any(Object),
        timeBuffer: expect.any(Object),
        mouseBuffer: expect.any(Object),
        startTime: expect.any(Number),
      })
    );
  });

  it('includes texture bindings in layout and bind group entries', () => {
    const textureView = {} as GPUTextureView;
    const sampler = {} as GPUSampler;

    // call createUniforms with a mix of valid and null texture bindings
    createUniforms(mockDevice, mockCanvas, [
      { textureView, sampler }, // binding 3 and 4
      null,                     // skipped
      { textureView, sampler }, // binding 7 and 8
    ]);

    // confirm texture/sampler bindings are added to layout
    expect(mockDevice.createBindGroupLayout).toHaveBeenCalledWith(
      expect.objectContaining({
        entries: expect.arrayContaining([
          expect.objectContaining({ binding: 3, texture: expect.any(Object) }),
          expect.objectContaining({ binding: 4, sampler: expect.any(Object) }),
          expect.objectContaining({ binding: 7, texture: expect.any(Object) }),
          expect.objectContaining({ binding: 8, sampler: expect.any(Object) }),
        ]),
      })
    );

    // ensure they are also added to the bind group entries
    expect(mockDevice.createBindGroup).toHaveBeenCalledWith(
      expect.objectContaining({
        entries: expect.arrayContaining([
          expect.objectContaining({ binding: 3, resource: textureView }),
          expect.objectContaining({ binding: 4, resource: sampler }),
          expect.objectContaining({ binding: 7, resource: textureView }),
          expect.objectContaining({ binding: 8, resource: sampler }),
        ]),
      })
    );
  });
});
