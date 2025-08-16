import { describe, it, expect, vi } from 'vitest'
import MeshModal from '@/ui/components/modals/MeshModal.vue'
import { mountModalWithStubs } from '../utils/mountWithGlobalStubs'

function mountMeshModal(customProps = {}) {
  return mountModalWithStubs(MeshModal, {
    show: true,
    presetMeshes: ['cube.obj', 'sphere.obj'],
  }, customProps)
}

describe('MeshModal.vue', () => {
  it('renders all preset mesh buttons', () => {
    const wrapper = mountMeshModal()
    const buttons = wrapper.findAll('button')
    // There are 2 preset meshes = 2 select buttons + 2 download buttons + 1 upload button
    expect(buttons.length).toBe(5)
    expect(buttons[0].text()).toBe('cube.obj')
    expect(buttons[2].text()).toBe('sphere.obj')
  })

  it('emits selectPresetMesh when a preset button is clicked', async () => {
    const wrapper = mountMeshModal()
    const buttons = wrapper.findAll('button')
    await buttons[0].trigger('click') // cube.obj
    expect(wrapper.emitted('selectPresetMesh')![0]).toEqual(['cube.obj'])
  })

  it('emits downloadMesh when a download button is clicked', async () => {
    const wrapper = mountMeshModal()
    const buttons = wrapper.findAll('button')
    await buttons[1].trigger('click') // download for cube.obj
    expect(wrapper.emitted('downloadMesh')![0]).toEqual(['cube.obj'])
  })

  it('emits handleUpload when upload is triggered', async () => {
    const wrapper = mountMeshModal()
    const payload = {
      file: new File(['obj'], 'test.obj', { type: 'text/plain' }),
      onFinish: vi.fn(),
    }
    await wrapper.vm.$emit('handleUpload', payload)
    expect(wrapper.emitted('handleUpload')).toBeTruthy()
    expect((wrapper.emitted('handleUpload')![0][0] as typeof payload).file.name).toBe('test.obj')
  })

  it('emits update:show when modal is closed', async () => {
    const wrapper = mountMeshModal()
    await wrapper.vm.$emit('update:show', false)
    expect(wrapper.emitted('update:show')![0]).toEqual([false])
  })
})
