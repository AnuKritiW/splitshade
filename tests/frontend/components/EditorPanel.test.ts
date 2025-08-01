import { describe, it, expect, vi } from 'vitest'
import EditorPanel from '@/components/EditorPanel.vue'
import { mountWithGlobalStubs } from '../utils/mountWithGlobalStubs'


// custom mount function for EditorPanel that provides stubbed Naive UI components
// including a stub for n-card that renders the footer slot.
function mountEditorPanelWithFooterStub(props?: any) {
  return mountWithGlobalStubs(EditorPanel, {
    props,
    slots: {},
    global: {
      stubs: {
        // stub <n-card> and manually render default and footer slots
        'n-card': {
          template: `
            <div>
              <slot />
              <slot name="footer" />
            </div>
          `,
        },
        // stub <n-button> as basic HTML <button>
        'n-button': {
          template: '<button><slot /></button>',
        },
      },
    },
  })
}

describe('EditorPanel.vue', () => {

  // Test: the component correctly receives and initializes with the 'code' prop
  it('initializes editor with code prop', () => {
    const runShaderMock = vi.fn() // mock function for runShader
    const wrapper = mountEditorPanelWithFooterStub({
      code: 'initial code',
      runShader: runShaderMock,
    })

    // Find the Monaco editor and check that it received the right initial value
    const editor = wrapper.findComponent({ name: 'VueMonacoEditor' })
    expect(editor.props('value')).toBe('initial code')
  })

  // Test: the component emits an 'update:code' event
  it('emits update:code when editor content changes', async () => {
    const runShaderMock = vi.fn()
    const wrapper = mountEditorPanelWithFooterStub({
      code: 'original code',
      runShader: runShaderMock,
    })

    // Simulate a change event from the Monaco editor
    const newCode = 'modified code'
    wrapper.findComponent({ name: 'VueMonacoEditor' }).vm.$emit('change', newCode)

    await wrapper.vm.$nextTick() // wait for reactivity to flush
    // assert that the 'update:code' event was emitted with the new value
    expect(wrapper.emitted('update:code')).toBeTruthy()
    expect(wrapper.emitted('update:code')![0]).toEqual([newCode])
  })

  // Test: clicking "Run Shader" calls runShader function
  it('calls runShader when Run Shader button is clicked', async () => {
    const runShaderMock = vi.fn()
    const wrapper = mountEditorPanelWithFooterStub({
      code: 'test',
      runShader: runShaderMock,
    })

    const button = wrapper.find('button') // find stubbed <n-button>
    await button.trigger('click')         // simulate click
    expect(runShaderMock).toHaveBeenCalled()
  })
})
