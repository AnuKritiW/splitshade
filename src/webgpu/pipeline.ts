export function createPipeline(
  device: GPUDevice,
  vertexModule: GPUShaderModule,
  fragmentModule: GPUShaderModule,
  fragmentEntryPoint: string,
  format: GPUTextureFormat,
  layout: GPUPipelineLayout,
  vertexEntryPoint: string
) {
  return device.createRenderPipeline({
    layout,
    vertex: {
      module: vertexModule,
      entryPoint: vertexEntryPoint,
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
