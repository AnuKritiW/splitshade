import { ref, computed } from 'vue'
import { DEFAULT_TEXTURES } from '../webgpu/textures'

export function useTextures() {
  type TextureChannels = {
    iChannel0: string | null
    iChannel1: string | null
    iChannel2: string | null
    iChannel3: string | null
  }

  const selectedTextures = ref<TextureChannels>({
    iChannel0: DEFAULT_TEXTURES[0].path,
    iChannel1: DEFAULT_TEXTURES[1].path,
    iChannel2: DEFAULT_TEXTURES[2].path,
    iChannel3: DEFAULT_TEXTURES[3].path,
  })

  const availableTextures = ref<string[]>([])
  const showTextureModal = ref(false)
  const activeChannel = ref<'iChannel0'|'iChannel1'|'iChannel2'|'iChannel3'>('iChannel0')

  function openTextureModal(channel: typeof activeChannel.value) {
    activeChannel.value = channel
    showTextureModal.value = true
  }
  function selectTexture(img: string) {
    selectedTextures.value[activeChannel.value] = img
    showTextureModal.value = false
  }
  function handleUpload({ file, onFinish }: any) {
    const reader = new FileReader()
    reader.onload = () => {
      const imgSrc = reader.result as string
      availableTextures.value.push(imgSrc)
      selectedTextures.value[activeChannel.value] = imgSrc
      showTextureModal.value = false
      onFinish()
    }
    reader.readAsDataURL(file.file)
  }

  const allTextures = computed(() =>
    DEFAULT_TEXTURES.map(t=>t.path).concat(availableTextures.value)
  )

  return {
    selectedTextures,
    availableTextures,
    allTextures,
    showTextureModal,
    activeChannel,
    openTextureModal,
    selectTexture,
    handleUpload,
  }
}
