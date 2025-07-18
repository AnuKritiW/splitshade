export function createPipeline(
  device: GPUDevice,
  vertexModule: GPUShaderModule,
  fragmentModule: GPUShaderModule,
  fragmentEntryPoint: string,
  format: GPUTextureFormat,
  layout: GPUPipelineLayout,
  vertexEntryPoint: string,
  useVertexInput: boolean = false
) {
  return device.createRenderPipeline({
    layout,
    vertex: {
      module: vertexModule,
      entryPoint: vertexEntryPoint,
      buffers: useVertexInput ? [
        {
          arrayStride: 24, // 3 floats for position + 3 for color = 6 × 4 bytes
          attributes: [
            {
              shaderLocation: 0,
              offset: 0,
              format: 'float32x3' // position
            },
            {
              shaderLocation: 1,
              offset: 12,
              format: 'float32x3' // color
            }
          ]
        }
      ] : []
    },
    fragment: {
      module: fragmentModule,
      entryPoint: fragmentEntryPoint,
      targets: [{ format }],
    },
    primitive: {
      topology: "triangle-list",
    },
  });
}
