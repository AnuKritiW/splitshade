import { useTextures } from '@/composables/useTextures'

describe('useTextures', () => {

  // Test: Selecting a texture updates the correct channel in selectedTextures
  it('updates selectedTextures when selectTexture is called', () => {
    const {
      selectedTextures,
      selectTexture,
      openTextureModal,
    } = useTextures()

    openTextureModal('iChannel0') // set the active channel
    selectTexture('texture.png') // simulates user selecting a texture

    // expect the selected texture to be correctly updated in selectedTextures
    expect(selectedTextures.value.iChannel0).toBe('texture.png')
  })

  // Test: Opening the modal sets the modal to visible
  it('opens texture modal via openTextureModal()', () => {
    const { showTextureModal, openTextureModal } = useTextures()

    expect(showTextureModal.value).toBe(false) // initially modal should be closed
    openTextureModal('iChannel0')              // simulate opening the modal for iChannel0
    expect(showTextureModal.value).toBe(true)  // modal should now be open
  })

  // Test: Modal is closed after selecting a texture
  it('closes texture modal after selecting a texture', () => {
    const {
      showTextureModal,
      openTextureModal,
      selectTexture,
    } = useTextures()

    openTextureModal('iChannel0')
    expect(showTextureModal.value).toBe(true)

    selectTexture('custom.png')
    expect(showTextureModal.value).toBe(false)
  })

  // Test: allTextures combines default and uploaded textures
  it('combines default and uploaded textures in allTextures', () => {
    const {
      allTextures,
      availableTextures,
    } = useTextures()

    availableTextures.value.push('custom-texture.png')        // simulate an uploaded texture using mock

    expect(allTextures.value).toContain('custom-texture.png') // allTextures should now include both defaults and the new texture
  })

  // Test: handleUpload processes file upload and updates state
  it('handles texture upload correctly and updates state', async () => {
    const {
      selectedTextures,
      availableTextures,
      handleUpload,
      openTextureModal,
      showTextureModal,
    } = useTextures()

    openTextureModal('iChannel1') // set the active channel

    // mock a fake file object
    const mockFile = new Blob(['test-image-data'], { type: 'image/png' })

    // spy on FileReader and simulate onload
    const mockResult = 'data:image/png;base64,fake-image-data'
    const readAsDataURL = vi.fn(function (this: FileReader) {
      (this as any).result = mockResult
      this.onload?.({} as ProgressEvent<FileReader>)
    })

    vi.stubGlobal('FileReader', vi.fn(() => ({
      readAsDataURL,
      onload: null,
      result: null,
    })))

    const onFinish = vi.fn()

    handleUpload({
      file: mockFile,
      onFinish,
    })

    expect(availableTextures.value).toContain(mockResult)
    expect(selectedTextures.value.iChannel1).toBe(mockResult)
    expect(showTextureModal.value).toBe(false)
    expect(onFinish).toHaveBeenCalled()
  })
})
