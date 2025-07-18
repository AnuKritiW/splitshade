# SplitShade - a browser-based WebGPU Playground

This project is a work in progress. For now, I am storing some notes on my README as I go along.

## Developer Notes

This version of the playground enforces a ShaderToy-style execution model:
- Only fragment shaders are accepted from user input.
- A hardcoded fullscreen vertex shader is injected automatically at runtime.
- Fragment shaders are compiled and run over the entire canvas using a triangle covering the full screen.
- Vertex and compute entry points are still detected (via `wgsl_reflect`), but are ignored and warned about in the console.

This setup ensures that users can write fragment shaders without having to define vertex logic or pipeline configuration.

### Injected Uniforms

The following uniforms are automatically injected and available to fragment shaders:

- `iResolution: vec3<f32>`  
  - Canvas resolution in pixels: (width, height, 1.0)

- `iTime: f32`  
  - Seconds since the render loop began

- `iMouse: vec4<f32>`  
  - Mouse position in pixels (`x`, `y`), click state (`z` = 1.0 when down, 0.0 otherwise), and padding (`w` = 0.0)

- `iChannel0-3`
- `iChannel0-3Sampler`

### Texture + Sampler Support

This phase adds support for rendering with an external image using `textureSample()` in fragment shaders. The image is loaded at runtime and passed to the shader via a bind group containing both a **texture view** and a **sampler**.

- The image is placed in `public/textures/` and served via the Vite base URL (`/splitshade/`).
- A `GPUTexture` is created from the decoded image bitmap.
- A `GPUTextureView` and `GPUSampler` are then created and added to the shader’s bind group at bindings `@binding(3)` and `@binding(4)`, respectively.

### Shader Examples

- `whiteCircle-resolutionTest.wgsl`: Uses `iResolution`
- `pulsingColours-timeTest.wgsl`: Uses `iTime`
- `mousePointerTest.wgsl`: Uses `iMouse`
- `defaultTex.wgsl`: Uses `iChannel0` abd `iChannel0Sampler`

### Sampler Types (KIV)

Currently, all injected samplers (e.g., iChannel0Sampler) are created as filtering samplers, which allow interpolated sampling via textureSample(). This matches the typical behavior expected in ShaderToy-style fragment shaders.

In the future, other sampler types could be supported like:
- sampler (non-filtering) — for manual mip-level control or compute shaders.
- sampler_comparison — for depth texture sampling (e.g., shadows).

# Vertex Shader support

```
// --- Vertex Shader Guide ---
//
// If you've uploaded a mesh (.obj), your vertex shader can access its data:
//
// Available vertex inputs:
// - @location(0) position: vec3<f32>   // 3D position from the mesh
// - @location(1) color: vec3<f32>      // Default white if not provided in .obj
//
// You must declare these as parameters to your vertex function, e.g.:
//
// @vertex
// fn main(
//   @location(0) position: vec3<f32>,
//   @location(1) color: vec3<f32>
// ) -> @builtin(position) vec4<f32> {
//   return vec4<f32>(position, 1.0);
// }
//
// If no mesh is uploaded, fallback fullscreen triangle will render instead.
```

feat: add optional mesh upload support with vertex buffer integration
- Accepts .obj mesh uploads and parses into GPU vertex buffers
- Automatically switches pipeline to use vertex input when mesh is present
- Adds default mesh-compatible shader code if no code is present
- Preserves fallback fullscreen triangle rendering when no mesh is uploaded
- Handles iChannel texture bindings dynamically
- Includes error handling and fallback logging

# Sources/References

- https://shadertoyunofficial.wordpress.com/2019/07/23/shadertoy-media-files/
- https://surma.dev/things/webgpu/#textures
- https://developer.mozilla.org/en-US/docs/Web/API/GPUDevice/createTexture
- https://developer.mozilla.org/en-US/docs/Web/API/GPUDevice/createSampler
- https://www.naiveui.com/en-US/os-theme/docs/introduction
- https://web.mit.edu/djwendel/www/weblogo/shapes/basic-shapes/sphere/sphere.obj
