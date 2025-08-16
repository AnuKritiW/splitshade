import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getWebGPUDevice, configureCanvasContext } from '@/core/context'

function mockNavigatorGpu(mockGpu: Partial<GPU> | undefined) {
  Object.defineProperty(navigator, 'gpu', {
    value: mockGpu,
    configurable: true,
  })
}

const originalNavigatorGpu = navigator.gpu

afterEach(() => {
  mockNavigatorGpu(originalNavigatorGpu)
})

describe('getWebGPUDevice', () => {
  it('returns nulls if WebGPU is not supported', async () => {
    mockNavigatorGpu(undefined)

    const { device, adapter } = await getWebGPUDevice()
    expect(device).toBeNull()
    expect(adapter).toBeNull()
  })

  it('returns a GPUDevice and GPUAdapter if available', async () => {
    const mockRequestDevice = vi.fn().mockResolvedValue({ name: 'MockDevice' })
    const mockRequestAdapter = vi.fn().mockResolvedValue({
      requestDevice: mockRequestDevice,
    })

    const mockGpu = {
      requestAdapter: mockRequestAdapter,
      getPreferredCanvasFormat: vi.fn().mockReturnValue('bgra8unorm'),
    }

    mockNavigatorGpu(mockGpu)

    const { device, adapter } = await getWebGPUDevice()
    expect(mockRequestAdapter).toHaveBeenCalled()
    expect(mockRequestDevice).toHaveBeenCalled()
    expect(device).toBeDefined()
    expect(adapter).toBeDefined()
  })
})

describe('configureCanvasContext', () => {
  beforeEach(() => {
    mockNavigatorGpu({
      getPreferredCanvasFormat: vi.fn().mockReturnValue('bgra8unorm'),
    })
  })

  it('configures the canvas context with expected settings', () => {
    const mockConfigure = vi.fn()
    const mockContext = { configure: mockConfigure }
    const mockCanvas = {
      getContext: vi.fn().mockReturnValue(mockContext),
    }

    const mockDevice = { id: 'FakeGPUDevice' } as unknown as GPUDevice
    const { context, format } = configureCanvasContext(mockCanvas as unknown as HTMLCanvasElement, mockDevice)

    expect(mockCanvas.getContext).toHaveBeenCalledWith('webgpu')
    expect(mockConfigure).toHaveBeenCalledWith({
      device: mockDevice,
      format: 'bgra8unorm',
      alphaMode: 'opaque',
    })
    expect(context).toBe(mockContext)
    expect(format).toBe('bgra8unorm')
  })

  it('throws if getContext returns null', () => {
    const mockCanvas = {
      getContext: vi.fn().mockReturnValue(null),
    }

    const mockDevice = {} as GPUDevice

    expect(() => {
      configureCanvasContext(mockCanvas as unknown as HTMLCanvasElement, mockDevice)
    }).toThrowError('WebGPU context is not available on the provided canvas.')
  })
})

describe('getWebGPUDevice failure cases', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('returns nulls if requestAdapter returns null', async () => {
    mockNavigatorGpu({
      requestAdapter: vi.fn().mockResolvedValue(null),
      getPreferredCanvasFormat: vi.fn(),
    })

    const { getWebGPUDevice } = await import('@/core/context')
    const { device, adapter } = await getWebGPUDevice()
    expect(device).toBeNull()
    expect(adapter).toBeNull()
  })

  it('returns nulls if adapter.requestDevice returns null', async () => {
    const mockAdapter = {
      requestDevice: vi.fn().mockResolvedValue(null),
    }

    mockNavigatorGpu({
      requestAdapter: vi.fn().mockResolvedValue(mockAdapter),
      getPreferredCanvasFormat: vi.fn(),
    })

    const { getWebGPUDevice } = await import('@/core/context')
    const { device, adapter } = await getWebGPUDevice()
    expect(device).toBeNull()
    expect(adapter).toBeNull()
  })
})
