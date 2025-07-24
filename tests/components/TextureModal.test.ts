import { describe, it, expect, vi } from 'vitest'
import TextureModal from '@/components/TextureModal.vue'
import { mountWithGlobalStubs } from '../test-utils/mountWithGlobalStubs'

function mountTextureModal(customProps = {}) {
  return mountWithGlobalStubs(TextureModal, {
    props: {
      show: true,
      allTextures: ['img1.png', 'img2.jpg'],
      ...customProps,
    },
    global: {
      stubs: {
        teleport: true, // render modal outside the component tree
        'n-modal': {
          props: ['modelValue'],
          emits: ['update:modelValue'],
          template: `<div><slot /></div>`,
        },
        'n-card': { template: '<div><slot /><slot name="header" /></div>' },
        'n-image': {
          props: ['src'],
          template: `<img :src="src" @click="$emit('click')" />`
        },
        'n-upload': {
          template: '<div><slot /></div>',
          props: ['customRequest'],
        },
        'n-button': { template: '<button><slot /></button>' },
      },
    },
  })
}

describe('TextureModal.vue', () => {
  it('renders thumbnails for each texture', () => {
    const wrapper = mountTextureModal()
    const images = wrapper.findAll('img')
    expect(images.length).toBe(2)
  })

  it('emits selectTexture when a thumbnail is clicked', async () => {
    const wrapper = mountTextureModal()
    const images = wrapper.findAll('img')
    await images[0].trigger('click')
    expect(wrapper.emitted('selectTexture')).toBeTruthy()
  })

  it('emits update:show when modal is toggled', async () => {
    const wrapper = mountTextureModal()
    await wrapper.vm.$emit('update:show', false)
    expect(wrapper.emitted('update:show')![0]).toEqual([false])
  })

  it('emits handleUpload when custom upload is triggered', async () => {
    const wrapper = mountTextureModal()
    const payload = {
      file: new File(['dummy'], 'dummy.png', { type: 'image/png' }),
      onFinish: vi.fn(),
    }
    await wrapper.vm.$emit('handleUpload', payload)
    expect(wrapper.emitted('handleUpload')).toBeTruthy()
    expect((wrapper.emitted('handleUpload')![0][0] as typeof payload).file.name).toBe('dummy.png')
  })
})
