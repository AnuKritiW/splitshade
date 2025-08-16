import { loadDefaultTexture } from '@/resources/textures';

// image -- decoded --> ImageBitmap -- uploaded to GPU --> GPUTexture

describe('loadDefaultTexture', () => {
  let mockDevice: GPUDevice;

  // Global stubs for WebGPU and browser APIs
  beforeAll(() => {
    // mock the global GPUTextureUsage object
    vi.stubGlobal('GPUTextureUsage', {
      TEXTURE_BINDING: 1,
      COPY_DST: 2,
      RENDER_ATTACHMENT: 4,
    });

    vi.stubGlobal('Image', class {
      decode = vi.fn().mockResolvedValue(undefined);
      set src(_: string) {}
    });
  });

  beforeEach(() => {
    vi.restoreAllMocks(); // clean between tests

    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue({
      width: 256,
      height: 256,
    }));

    mockDevice = {
      createTexture: vi.fn().mockReturnValue({
        createView: vi.fn().mockReturnValue('mockTextureView'),
      }),
      createSampler: vi.fn().mockReturnValue('mockSampler'),
      queue: {
        copyExternalImageToTexture: vi.fn(),
      },
    } as unknown as GPUDevice;
  });

  it('loads a texture and returns textureView and sampler', async () => {
    // spy on the image src setter
    const srcSpy = vi.fn();
    vi.stubGlobal('Image', class {
      decode = vi.fn().mockResolvedValue(undefined);
      set src(value: string) {
        srcSpy(value); // capture what src is set to
      }
    });

    // mock createImageBitmap mock
    const mockBitmap = {
      width: 256,
      height: 256,
    };
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue(mockBitmap));

    const result = await loadDefaultTexture(mockDevice, '/some/image.png');

    // assert Image.src was set correctly
    expect(srcSpy).toHaveBeenCalledWith('/some/image.png');

    // assert texture creation was called with expected parameters
    expect(mockDevice.createTexture).toHaveBeenCalledWith(
      expect.objectContaining({
        size: [256, 256, 1],
        format: 'rgba8unorm-srgb',
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
      })
    );

    // assert correct copy from bitmap to texture
    expect(mockDevice.queue.copyExternalImageToTexture).toHaveBeenCalledWith(
      { source: mockBitmap },
      expect.objectContaining({ texture: expect.anything() }),
      [256, 256]
    );

    // assert sampler creation
    expect(mockDevice.createSampler).toHaveBeenCalledWith({
      magFilter: 'linear',
      minFilter: 'linear',
      addressModeU: 'repeat',
      addressModeV: 'repeat',
    });

    expect(result).toEqual({
      textureView: 'mockTextureView',
      sampler: 'mockSampler',
    });
  });

  it('throws if image decoding fails', async () => {
    vi.stubGlobal('Image', class {
      decode = vi.fn().mockRejectedValue(new Error('decode failed'));
      set src(_: string) {}
    });

    await expect(loadDefaultTexture(mockDevice, '/fail.png'))
      .rejects.toThrow('decode failed');
  });
});
