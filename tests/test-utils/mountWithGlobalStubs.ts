import { mount, type MountingOptions, type VueWrapper } from '@vue/test-utils'
import type { ComponentPublicInstance } from 'vue'

// Stub for Naive UI's <n-card>
// when <n-card> is encountered, render a basic <div> with its slot content
// this avoids warnings from external UI libraries like Naive UI that Vitest doesn’t auto-resolve
const defaultGlobalStubs = {
  'n-card': {
    template: '<div><slot /></div>',
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
