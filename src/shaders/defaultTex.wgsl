@group(0) @binding(0) var<uniform> iResolution: vec3<f32>;
@group(0) @binding(3) var iChannel0: texture_2d<f32>;
@group(0) @binding(4) var iChannel0Sampler: sampler;

@fragment
fn main(@builtin(position) fragCoord: vec4<f32>) -> @location(0) vec4<f32> {
  let uv = fragCoord.xy / iResolution.xy;
  return textureSample(iChannel0, iChannel0Sampler, uv);
}
