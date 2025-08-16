import { describe, it, expect } from 'vitest'
import ResourcesPanel from '@/ui/components/panels/ResourcesPanel.vue'
import { mountWithGlobalStubs } from '../../utils/mountWithGlobalStubs'

function mountResourcesPanel(customProps = {}) {
  return mountWithGlobalStubs(ResourcesPanel, {
    props: {
      selectedTextures: {
        iChannel0: null,
        iChannel1: null,
        iChannel2: null,
        iChannel3: null,
      },
      allTextures: [],
      showTextureModal: false,
      showMeshModal: false,
      presetMeshes: [],
      uploadedMesh: { name: '' },
      ...customProps,
    },
    global: {
      stubs: {
        // Stub Naive UI components to simplify DOM output and avoid dependency complexity
        'n-card': { template: '<div><slot /><slot name="header" /></div>' },
        'n-tabs': { template: '<div><slot /></div>' },
        'n-tab-pane': { template: '<div><slot /></div>' },
        'n-button': { template: '<button @click="$emit(\'click\')"><slot /></button>' },
        'n-icon': true, // // simple boolean stub for icon
      },
    },
  })
}

describe('ResourcesPanel.vue', () => {
  it('renders four iChannel buttons', () => {
    const wrapper = mountResourcesPanel()
    const buttons = wrapper.findAll('button.texture-button')
    expect(buttons.length).toBe(4)
    expect(buttons[0].text()).toContain('iChannel0')
    expect(buttons[3].text()).toContain('iChannel3')
  })

  it('emits openTextureModal when a texture button is clicked', async () => {
    const wrapper = mountResourcesPanel()
    const buttons = wrapper.findAll('button.texture-button')
    await buttons[1].trigger('click')
    expect(wrapper.emitted('openTextureModal')).toBeTruthy()
    expect(wrapper.emitted('openTextureModal')![0]).toEqual(['iChannel1'])
  })

  it('emits openMeshModal when mesh button is clicked', async () => {
    const wrapper = mountResourcesPanel()
    const meshButton = wrapper.findAll('button').find(b => b.text().includes('Select / Upload'))
    expect(meshButton).toBeTruthy()
    await meshButton!.trigger('click')
    expect(wrapper.emitted('openMeshModal')).toBeTruthy()
  })

  it('disables remove button if no uploaded mesh', () => {
    const wrapper = mountResourcesPanel()
    const removeButton = wrapper.findAll('button').find(b => b.text().includes('Remove'))
    expect(removeButton?.attributes('disabled')).toBeDefined()
  })

  it('emits removeMesh when remove button clicked and mesh is present', async () => {
    const wrapper = mountResourcesPanel({
      uploadedMesh: { name: 'example.obj' },
    })
    const removeButton = wrapper.findAll('button').find(b => b.text().includes('Remove'))
    expect(removeButton?.attributes('disabled')).toBeUndefined()
    await removeButton!.trigger('click')
    expect(wrapper.emitted('removeMesh')).toBeTruthy()
  })

  it('emits copyStarterCode when starter shader button is clicked', async () => {
    const wrapper = mountResourcesPanel()
    const starterButton = wrapper.findAll('button').find(b => b.text().includes('Copy Starter Shader'))
    await starterButton!.trigger('click')
    expect(wrapper.emitted('copyStarterCode')).toBeTruthy()
  })

  it('emits update:showTextureModal when showTextureModalProxy is toggled', async () => {
    const wrapper = mountResourcesPanel()
    await wrapper.vm.$emit('update:showTextureModal', true)
    expect(wrapper.emitted('update:showTextureModal')).toBeTruthy()
    expect(wrapper.emitted('update:showTextureModal')![0]).toEqual([true])
  })

  it('emits update:showMeshModal when showMeshModalProxy is toggled', async () => {
    const wrapper = mountResourcesPanel()
    await wrapper.vm.$emit('update:showMeshModal', true)
    expect(wrapper.emitted('update:showMeshModal')).toBeTruthy()
    expect(wrapper.emitted('update:showMeshModal')![0]).toEqual([true])
  })
})
