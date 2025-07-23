import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ConsolePanel from '@/components/ConsolePanel.vue'

describe('ConsolePanel.vue', () => {
  it('displays consoleOutput correctly', async () => {
    const testOutput = 'Shader compiled successfully'
    const wrapper = mount(ConsolePanel, {
      props: {
        consoleOutput: testOutput,
      },
      // when <n-card> is encountered, render a basic <div> with its slot content
      // this avoids warnings from external UI libraries like Naive UI that Vitest doesn’t auto-resolve
      global: {
        stubs: {
          'n-card': {
            template: '<div><slot /></div>',
          },
        },
      },
    })

    // wait for Vue to flush DOM updates after prop binding
    await wrapper.vm.$nextTick()

    // target only the .console-content element to verify displayed output.
    const content = wrapper.find('.console-content')
    expect(content.text()).toContain(testOutput)
  })

  it('updates display when consoleOutput prop changes', async () => {
    const wrapper = mount(ConsolePanel, {
      props: {
        consoleOutput: 'Initial output',
      },
      global: {
        stubs: {
          'n-card': {
            template: '<div><slot /></div>',
          },
        },
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
