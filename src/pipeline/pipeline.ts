/**
 * WebGPU Render Pipeline Factory
 *
 * This module provides utilities for creating WebGPU render pipelines
 * with configurable vertex attributes and shader modules.
 */

/**
 * Creates a WebGPU render pipeline with the specified configuration.
 *
 * Configures vertex and fragment stages, handles vertex buffer layout
 * for both fullscreen quad and custom mesh rendering modes.
 *
 * @param device - WebGPU device instance
 * @param vertexModule - Compiled vertex shader module
 * @param fragmentModule - Compiled fragment shader module
 * @param fragmentEntryPoint - Entry function name in fragment shader
 * @param format - Target texture format (usually canvas format)
 * @param layout - Pipeline resource binding layout
 * @param vertexEntryPoint - Entry function name in vertex shader
 * @param useVertexInput - Whether to enable vertex buffer input (default: false)
 *
 * @returns Configured render pipeline ready for rendering
 *
 * @remarks
 * - When useVertexInput is false, assumes fullscreen quad with no vertex buffers
 * - When useVertexInput is true, expects interleaved position/color vertex data
 * - Vertex layout: position (float32x3) + color (float32x3) = 24 bytes stride
 * - Uses triangle-list primitive topology for standard rendering
 */
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
