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

/**
 * WebGPU Texture Loading and Management
 *
 * This module handles texture creation, loading, and management for WebGPU shaders.
 * Provides utilities for loading default textures and checking shader texture usage.
 */

/**
 * Default texture catalog available in the shader playground.
 *
 * Collection of pre-loaded textures including abstract patterns,
 * photographic content, and utility textures for shader development.
 */
export const DEFAULT_TEXTURES = [
  { name: 'Abstract 1', path: '/splitshade/textures/abstract1.jpg' }, // public/ path
  { name: 'Abstract 2', path: '/splitshade/textures/abstract2.jpg' },
  { name: 'Abstract 3', path: '/splitshade/textures/abstract3.jpg' },
  { name: 'Abstract 4', path: '/splitshade/textures/abstract4.png' },
  { name: 'Abstract 5', path: '/splitshade/textures/abstract5.png' },
  { name: 'Abstract 6', path: '/splitshade/textures/abstract6.png' },
  { name: 'Abstract 7', path: '/splitshade/textures/abstract7.png' },
  { name: 'Abstract 8', path: '/splitshade/textures/abstract8.png' },
  { name: 'Abstract 9', path: '/splitshade/textures/abstract9.jpg' },
  { name: 'Abstract 10', path: '/splitshade/textures/abstract10.jpg' },
  { name: 'Abstract 11', path: '/splitshade/textures/abstract11.jpg' },
  { name: 'Abstract 12', path: '/splitshade/textures/abstract12.jpg' },
  { name: 'Abstract 13', path: '/splitshade/textures/abstract13.jpg' },
  { name: 'Abstract 14', path: '/splitshade/textures/abstract14.png' },
  { name: 'Abstract 15', path: '/splitshade/textures/abstract15.png' },
  { name: 'Abstract 16', path: '/splitshade/textures/abstract16.png' },
  { name: 'Abstract 17', path: '/splitshade/textures/abstract17.jpg' },
  { name: 'Abstract 18', path: '/splitshade/textures/abstract18.jpg' },
  { name: 'london', path: '/splitshade/textures/london.jpg' },
  { name: 'nyannCat', path: '/splitshade/textures/nyannCat.png' },
  { name: 'tile', path: '/splitshade/textures/tile.jpg' },
  { name: 'wood', path: '/splitshade/textures/wood.jpg' },
]

/**
 * Checks if a shader uses any texture channels (iChannel0-3).
 *
 * Analyzes WGSL shader code to determine if texture bindings are required.
 * Used to optimize uniform buffer creation and binding setup.
 *
 * @param shaderCode - WGSL fragment shader source code
 * @returns True if shader references any iChannel variables
 */
export function usesAnyTextures(shaderCode: string | undefined | null): boolean {
  if (!shaderCode || shaderCode.trim() === '') return false;
  return /\biChannel[0-3]\b/.test(shaderCode);
}

/**
 * Loads and prepares a texture for WebGPU shader usage.
 *
 * Downloads an image, converts it to GPU-optimized format, and creates
 * the necessary texture view and sampler for shader binding.
 *
 * @param device - WebGPU device instance
 * @param src - Image source URL or path
 *
 * @returns Promise resolving to texture view and sampler pair
 *
 * @remarks
 * - Texture format: rgba8unorm-srgb for standard color images
 * - Sampler configuration: linear filtering with repeat addressing
 * - Usage flags: TEXTURE_BINDING | COPY_DST | RENDER_ATTACHMENT
 * - Automatically handles image decoding and bitmap conversion
 */
export async function loadDefaultTexture(device: GPUDevice, src: string): Promise<{
  textureView: GPUTextureView;
  sampler: GPUSampler;
}> {
  const img = new Image();
  img.src = src;
  await img.decode();

  // Converts the HTMLImageElement into an ImageBitmap, which is optimized for GPU usage
  const bitmap = await createImageBitmap(img);

  // Allocates a GPU texture on the device
  const texture = device.createTexture({
    size: [bitmap.width, bitmap.height, 1], // size defines the width, height, and depth (depth = 1 for 2D)
    format: 'rgba8unorm-srgb', // how pixel data is stored — rgba8unorm is a common 8-bit format
    /*
        TEXTURE_BINDING: You want to sample this texture in a shader
        COPY_DST: You're going to copy image data into this texture
        RENDER_ATTACHMENT: Allows the texture to be used as a render target (e.g. storeOp: "store" if needed later)
    */
    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
  });

  // Copies pixel data from the browser-managed bitmap to the GPU-managed texture
  device.queue.copyExternalImageToTexture(
    { source: bitmap },
    { texture },
    [bitmap.width, bitmap.height]
  );

  // Creates a sampler, which tells the shader how to sample the texture
  const sampler = device.createSampler({
    magFilter: 'linear', // smooth interpolation between texels
    minFilter: 'linear',
    addressModeU: 'repeat',
    addressModeV: 'repeat',
  });

  return {
    textureView: texture.createView(), // a view into the texture
    sampler, // used in WGSL to perform texture lookups like textureSample()
  };
}
