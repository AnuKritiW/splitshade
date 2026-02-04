/*
 * SPDX-License-Identifier: GPL-3.0-only
 *
 * SplitShade: WebGPU Playground
 * Copyright (C) 2025 Anu Kriti Wadhwa
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { ref, computed } from 'vue'

import { DEFAULT_TEXTURES } from '@/resources/textures'

/**
 * Vue composable for managing texture inputs in the shader editor.
 *
 * Provides reactive texture management with support for built-in textures,
 * user uploads, and a modal-based texture selection interface.
 *
 * @returns Object containing texture state and management functions
 *
 * @example
 * ```typescript
 * const { selectedTextures, openTextureModal, selectTexture } = useTextures()
 *
 * // Open texture selector for channel 0
 * openTextureModal('iChannel0')
 *
 * // Select a texture
 * selectTexture('path/to/texture.jpg')
 * ```
 */
export function useTextures() {
  /**
   * Type definition for the four texture channels available in shaders.
   * Each channel can hold a texture URL or be null (no texture).
   */
  type TextureChannels = {
    /** Primary texture channel */
    iChannel0: string | null
    /** Secondary texture channel */
    iChannel1: string | null
    /** Tertiary texture channel */
    iChannel2: string | null
    /** Quaternary texture channel */
    iChannel3: string | null
  }

  /** Currently selected textures for each channel, initialized with defaults */
  const selectedTextures = ref<TextureChannels>({
    iChannel0: DEFAULT_TEXTURES[0].path,
    iChannel1: DEFAULT_TEXTURES[1].path,
    iChannel2: DEFAULT_TEXTURES[2].path,
    iChannel3: DEFAULT_TEXTURES[3].path,
  })

  /** User-uploaded textures (as data URLs) */
  const availableTextures = ref<string[]>([])

  /** Controls visibility of the texture selection modal */
  const showTextureModal = ref(false)

  /** The currently active texture channel being edited */
  const activeChannel = ref<'iChannel0'|'iChannel1'|'iChannel2'|'iChannel3'>('iChannel0')

  /**
   * Opens the texture selection modal for a specific channel.
   *
   * @param channel - The texture channel to edit (iChannel0-3)
   */
  function openTextureModal(channel: typeof activeChannel.value) {
    activeChannel.value = channel
    showTextureModal.value = true
  }

  /**
   * Selects a texture for the currently active channel and closes the modal.
   *
   * @param img - Texture URL or data URL to assign to the active channel
   */
  function selectTexture(img: string) {
    selectedTextures.value[activeChannel.value] = img
    showTextureModal.value = false
  }

  /**
   * Handles texture file uploads from the user.
   *
   * Converts uploaded files to data URLs and adds them to the available textures.
   * Automatically assigns the uploaded texture to the currently active channel.
   *
   * @param params - Upload parameters containing file and onFinish callback
   */
  function handleUpload({ file, onFinish }: any) {
    const reader = new FileReader()
    reader.onload = () => {
      const imgSrc = reader.result as string
      availableTextures.value.push(imgSrc)
      selectedTextures.value[activeChannel.value] = imgSrc
      showTextureModal.value = false
      onFinish()
    }
    const blob = (file.file ?? file)
    console.log("Uploading file:", file)
    reader.readAsDataURL(blob)
  }

  /** Computed array of all available textures (built-in + user uploads) */
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
