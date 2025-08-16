import { describe, it, expect } from 'vitest'
import PreviewPanel from '@/ui/components/panels/PreviewPanel.vue'
import { mountWithGlobalStubs } from '../../utils/mountWithGlobalStubs'

describe('PreviewPanel.vue', () => {
  // Test: <canvas> element renders inside the component
  it('renders canvas element', () => {
    const wrapper = mountWithGlobalStubs(PreviewPanel)
    expect(wrapper.find('canvas').exists()).toBe(true)
  })

  // Test: component exposes its internal canvasRef correctly
  it('exposes canvasRef', () => {
    const wrapper = mountWithGlobalStubs(PreviewPanel)
    type PreviewPanelExposed = {
      canvasRef: HTMLCanvasElement | null
    }
    const exposed = wrapper.vm as unknown as PreviewPanelExposed
    expect(exposed.canvasRef).not.toBe(null)
    expect(exposed.canvasRef instanceof HTMLCanvasElement).toBe(true)
  })
})
