import { mount, type MountingOptions, type VueWrapper } from '@vue/test-utils'
import { vi } from 'vitest'
import type { Component, ComponentPublicInstance } from 'vue'

// Default stub config to avoid warnings for external components during testing
const defaultGlobalStubs = {
  // Stub for Naive UI's <n-card>
  // when <n-card> is encountered, render a basic <div> with its slot content
  // this avoids warnings from external UI libraries like Naive UI that Vitest doesn’t auto-resolve
  'n-card': {
    template: '<div><slot /></div>',
  },
  // Stub for EditorPanel that emits editor-ready event
  EditorPanel: {
    name: 'EditorPanel',
    props: ['code', 'runShader'],
    emits: ['update:code', 'go-to-line', 'reset-to-default', 'clear', 'editor-ready'],
    template: `<div>Editor Panel Mock</div>`,
    mounted() {
      // @ts-ignore - Vue component context
      this.$nextTick(() => {
        // @ts-ignore - Vue component context
        this.$emit('editor-ready')
      })
    }
  },
  // Stub <VueMonacoEditor> with a basic <textarea> that emits 'change' on input
  VueMonacoEditor: {
    name: 'VueMonacoEditor',
    props: ['value'],
    emits: ['change', 'mount'],
    template: `<textarea :value="value" @input="$emit('change', $event.target.value)" />`,
    mounted() {
      // Simulate the editor mount event which triggers the editor-ready event in the real component
      // @ts-ignore - Vue component context
      this.$nextTick(() => {
        // @ts-ignore - Vue component context
        this.$emit('mount', {
          setValue: vi.fn(),
          // @ts-ignore - Vue component context
          getValue: () => this.value,
          onDidChangeModelContent: () => ({ dispose: vi.fn() }),
          getModel: () => ({
            getFullModelRange: () => ({ startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 })
          }),
          executeEdits: vi.fn(),
          setPosition: vi.fn(),
          focus: vi.fn(),
          revealLineInCenter: vi.fn()
        })
      })
    }
  },
}

export function mountWithGlobalStubs<T extends ComponentPublicInstance>(
  component: any,
  options: MountingOptions<any> = {}
): VueWrapper<T> {
  return mount(component, {
    ...options,                           // spread user’s mount options (e.g., props, slots, attrs, etc.)
    global: {
      ...(options.global || {}),          // include global config if provided (like plugins, mocks, etc.)
      stubs: {
        ...defaultGlobalStubs,
        ...(options.global?.stubs || {}), // allow overriding or adding other stubs
      },
    },
  })
}

export function mountModalWithStubs(
  component: Component,
  defaultProps: Record<string, any>,
  customProps: Record<string, any> = {}
): VueWrapper {
  return mountWithGlobalStubs(component, {
    props: { ...defaultProps, ...customProps },
    global: {
      stubs: {
        teleport: true,
        'n-modal': { template: '<div><slot /></div>' },
        'n-card': { template: '<div><slot /></div>' },
        'n-button': { template: '<button><slot /></button>' },
        'n-upload': {
          template: '<div><slot /></div>',
          props: ['customRequest'],
        },
        'n-image': {
          props: ['src'],
          template: `<img :src="src" @click="$emit('click')" />`,
        },
      },
    },
  })
}