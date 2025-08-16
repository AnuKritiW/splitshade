import { describe, it, expect, vi } from 'vitest'

import TextureModal from '@/ui/components/modals/TextureModal.vue'

import { mountModalWithStubs } from '@tests/ui/utils/mountWithGlobalStubs'

function mountTextureModal(customProps = {}) {
  return mountModalWithStubs(TextureModal, {
    show: true,
    allTextures: ['img1.png', 'img2.jpg'],
  }, customProps)
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
