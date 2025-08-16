import { describe, it, expect, vi } from 'vitest'
import { createPipeline } from '@/pipeline/pipeline'

describe('createPipeline', () => {
  const mockCreateRenderPipeline = vi.fn()
  const mockDevice = {
    createRenderPipeline: mockCreateRenderPipeline,
  } as unknown as GPUDevice

  const mockVertexModule = {} as GPUShaderModule
  const mockFragmentModule = {} as GPUShaderModule
  const mockLayout = {} as GPUPipelineLayout
  const format = 'bgra8unorm'
  const vertexEntryPoint = 'mainVert'
  const fragmentEntryPoint = 'mainFrag'

  beforeEach(() => {
    mockCreateRenderPipeline.mockClear()
  })

  it('creates a pipeline without vertex input', () => {
    createPipeline(
      mockDevice,
      mockVertexModule,
      mockFragmentModule,
      fragmentEntryPoint,
      format,
      mockLayout,
      vertexEntryPoint,
      false
    )

    expect(mockCreateRenderPipeline).toHaveBeenCalledWith(expect.objectContaining({
      layout: mockLayout,
      vertex: expect.objectContaining({
        module: mockVertexModule,
        entryPoint: vertexEntryPoint,
        buffers: [],
      }),
      fragment: expect.objectContaining({
        module: mockFragmentModule,
        entryPoint: fragmentEntryPoint,
        targets: [{ format }], // TODO: If formats become user-configurable in the future, validate that the passed `format` is supported by the device.
      }),
      primitive: expect.objectContaining({
        topology: 'triangle-list',
      }),
    }))
  })

  it('creates a pipeline with vertex input', () => {
    createPipeline(
      mockDevice,
      mockVertexModule,
      mockFragmentModule,
      fragmentEntryPoint,
      format,
      mockLayout,
      vertexEntryPoint,
      true
    )

    const callArgs = mockCreateRenderPipeline.mock.calls[0][0]

    expect(callArgs.vertex.buffers).toHaveLength(1)
    expect(callArgs.vertex.buffers[0]).toEqual({
      arrayStride: 24,
      attributes: [
        {
          shaderLocation: 0,
          offset: 0,
          format: 'float32x3',
        },
        {
          shaderLocation: 1,
          offset: 12,
          format: 'float32x3',
        },
      ],
    })
  })
})
