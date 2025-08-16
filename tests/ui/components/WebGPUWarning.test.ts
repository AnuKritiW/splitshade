import { describe, it, expect } from 'vitest'
import WebGPUWarning from '@/ui/components/WebGPUWarning.vue'
import { mountWithGlobalStubs } from '../utils/mountWithGlobalStubs'
import { nextTick } from 'vue'

// create mount helper with necessary stub for <n-alert>
function mountWebGPUWarning() {
  return mountWithGlobalStubs(WebGPUWarning, {
    global: {
      stubs: {
        'n-alert': {
          template: '<div class="n-alert"><slot /></div>',
        },
      },
    },
  })
}

describe('WebGPUWarning.vue', () => {
  it('does not show alert when navigator.gpu is available', () => {
    // Mock navigator.gpu to simulate support
    Object.defineProperty(navigator, 'gpu', {
      value: {},
      configurable: true,
    })

    const wrapper = mountWebGPUWarning()
    expect(wrapper.find('.n-alert').exists()).toBe(false)
  })

  it('shows alert when navigator.gpu is not available', async () => {
    // Delete navigator.gpu to simulate unsupported environment
    Object.defineProperty(navigator, 'gpu', {
      value: undefined,
      configurable: true,
    })

    const wrapper = mountWebGPUWarning()
    await nextTick() // wait for onMounted() to update reactive state

    expect(wrapper.find('.n-alert').exists()).toBe(true)
    expect(wrapper.text()).toContain('does not support WebGPU')
  })
})
