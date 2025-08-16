import { useShaderRunner } from '@/ui/composables/useShaderRunner'
import { vi } from 'vitest'

// Mock initWebGPU
vi.mock('@/runtime/renderer', () => ({
  initWebGPU: vi.fn()
}))

import { initWebGPU } from '@/runtime/renderer'

describe('useShaderRunner', () => {
  beforeEach(() => {
    vi.clearAllMocks() // reset mocks before each test
  })

  it('calls initWebGPU', () => {
    const { runShader } = useShaderRunner()

    const mockCanvas = document.createElement('canvas')
    const mockCode = 'shader code here'

    // all textures are populated by default
    const mockTextures = {
      iChannel0: '/img/tex0.png',
      iChannel1: '/img/tex1.png',
      iChannel2: '/img/tex2.png',
      iChannel3: '/img/tex3.png',
    }
    const mockMesh = new Float32Array([1, 2, 3])
    const mockOnLog = vi.fn()

    runShader({
      canvas: mockCanvas,
      code: mockCode,
      textures: mockTextures,
      mesh: mockMesh,
      onLog: mockOnLog,
    })

    expect(initWebGPU).toHaveBeenCalledWith(
      mockCanvas,
      mockCode,
      {
        iChannel0: '/img/tex0.png',
        iChannel1: '/img/tex1.png',
        iChannel2: '/img/tex2.png',
        iChannel3: '/img/tex3.png',
      },
      mockOnLog,
      undefined, // no structured error callback is provided
      mockMesh
    )
  })
})
