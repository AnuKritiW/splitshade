import { describe, it, expect } from 'vitest'

import ConsolePanel from '@/ui/components/panels/ConsolePanel.vue'

import { mountWithGlobalStubs } from '@tests/ui/utils/mountWithGlobalStubs'


describe('ConsolePanel.vue', () => {
  it('displays consoleOutput correctly', async () => {
    const testOutput = 'Shader compiled successfully'
    const wrapper = mountWithGlobalStubs(ConsolePanel, {
      props: {
        consoleOutput: testOutput,
      },
    })

    // wait for Vue to flush DOM updates after prop binding
    await wrapper.vm.$nextTick()

    // target only the .console-content element to verify displayed output.
    const content = wrapper.find('.console-content')
    expect(content.text()).toContain(testOutput)
  })

  it('updates display when consoleOutput prop changes', async () => {
    const wrapper = mountWithGlobalStubs(ConsolePanel, {
      props: {
        consoleOutput: 'Initial output',
      },
    })

    // update prop
    await wrapper.setProps({ consoleOutput: 'Updated output' })
    await wrapper.vm.$nextTick()

    // ensure component displays the new output
    const content = wrapper.find('.console-content')
    expect(content.text()).toContain('Updated output')
  })
})
