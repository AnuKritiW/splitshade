/**
 * loadDefaultTexture loads a default texture and sampler for use in WebGPU shaders.
 * It fetches an image, converts it to a GPU texture, and creates a sampler.
 * 
 * A texture holds pixel data (like an image)
 * A sampler defines how that texture is accessed (filtering, wrapping, etc)
 */

export async function loadDefaultTexture(device: GPUDevice): Promise<{
  textureView: GPUTextureView;
  sampler: GPUSampler;
}> {
  const img = new Image();
  // TODO: use a more robust path resolution method, e.g. import.meta.url or a relative path
  img.src = '/splitshade/textures/abstract1.jpg'; // public/ path
  await img.decode();

  // Converts the HTMLImageElement into an ImageBitmap, which is optimized for GPU usage
  const bitmap = await createImageBitmap(img);

  // Allocates a GPU texture on the device
  const texture = device.createTexture({
    size: [bitmap.width, bitmap.height, 1], // size defines the width, height, and depth (depth = 1 for 2D)
    format: 'rgba8unorm', // how pixel data is stored — rgba8unorm is a common 8-bit format
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
  });

  return {
    textureView: texture.createView(), // a view into the texture
    sampler, // used in WGSL to perform texture lookups like textureSample()
  };
}
