import { describe, it, expect, vi } from 'vitest'

import { fullscreenVertexWGSL, injectedHeader, compileShaderModule } from '@/shader/shaderUtils'

describe('shaders module', () => {
  it('defines fullscreenVertexWGSL with expected contents', () => {
    expect(fullscreenVertexWGSL).toMatch(/@vertex/)
    expect(fullscreenVertexWGSL).toMatch(/vertex_index/)
  })

  it('defines injectedHeader with expected bindings', () => {
    expect(injectedHeader).toMatch(/@group\(0\) @binding\(0\) var<uniform> iResolution/)
    expect(injectedHeader).toMatch(/@group\(0\) @binding\(1\) var<uniform> iTime/)
    expect(injectedHeader).toMatch(/@group\(0\) @binding\(2\) var<uniform> iMouse/)
    expect(injectedHeader).toMatch(/@group\(0\) @binding\(3\) var iChannel0/)
    expect(injectedHeader).toMatch(/@group\(0\) @binding\(4\) var iChannel0Sampler/)
    expect(injectedHeader).toMatch(/@group\(0\) @binding\(5\) var iChannel1/)
    expect(injectedHeader).toMatch(/@group\(0\) @binding\(6\) var iChannel1Sampler/)
    expect(injectedHeader).toMatch(/@group\(0\) @binding\(7\) var iChannel2/)
    expect(injectedHeader).toMatch(/@group\(0\) @binding\(8\) var iChannel2Sampler/)
    expect(injectedHeader).toMatch(/@group\(0\) @binding\(9\) var iChannel3/)
    expect(injectedHeader).toMatch(/@group\(0\) @binding\(10\) var iChannel3Sampler/)
  })

  describe('compileShaderModule', () => {
    const mockDevice = {
      createShaderModule: vi.fn(({ code }) => ({
        code,
        getCompilationInfo: vi.fn().mockResolvedValue({ messages: [] }),
      })),
    } as unknown as GPUDevice

    it('returns module if no messages', async () => {
      const result = await compileShaderModule(mockDevice, 'fake shader code')
      expect(result.module).not.toBeNull()
      expect(result.errors.length).toBe(0)
      expect(result.hasErrors).toBe(false)
    })

    it('returns module if only warnings', async () => {
      const warningMsg = { type: 'warning', lineNum: 1, linePos: 1, message: 'This is a warning' }
      const deviceWithWarning = {
        createShaderModule: vi.fn(() => ({
          getCompilationInfo: vi.fn().mockResolvedValue({ messages: [warningMsg] }),
        })),
      } as unknown as GPUDevice

      const result = await compileShaderModule(deviceWithWarning, 'some shader')

      expect(result.module).not.toBeNull()
      expect(result.errors.length).toBe(1)
      expect(result.errors[0].type).toBe('warning')
      expect(result.errors[0].message).toBe('This is a warning')
      expect(result.hasErrors).toBe(false)
    })

    it('returns null if any message is an error', async () => {
      const errorMsg = { type: 'error', lineNum: 2, linePos: 4, message: 'Syntax error' }
      const deviceWithError = {
        createShaderModule: vi.fn(() => ({
          getCompilationInfo: vi.fn().mockResolvedValue({ messages: [errorMsg] }),
        })),
      } as unknown as GPUDevice

      const result = await compileShaderModule(deviceWithError, 'broken shader')

      expect(result.module).toBeNull()
      expect(result.errors.length).toBe(1)
      expect(result.errors[0].type).toBe('error')
      expect(result.errors[0].message).toBe('Syntax error')
      expect(result.hasErrors).toBe(true)
    })
  })
})
