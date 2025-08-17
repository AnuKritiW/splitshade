@group(0) @binding(0) var<uniform> iResolution: vec3<f32>;
@group(0) @binding(1) var<uniform> iTime: f32;
@group(0) @binding(2) var<uniform> iMouse: vec4<f32>;
@group(0) @binding(3) var iChannel0: texture_2d<f32>;
@group(0) @binding(4) var iChannel0Sampler: sampler;

@fragment
fn main(@builtin(position) fragCoord: vec4<f32>) -> @location(0) vec4<f32> {
  let uv = fragCoord.xy / iResolution.xy;
  let centered = uv * 2.0 - vec2<f32>(1.0, 1.0);

  // Simple radial lens distortion
  let strength = 0.4;
  let r = length(centered);
  let distorted = centered * (1.0 + strength * r * r);

  let warpedUV = (distorted + vec2<f32>(1.0, 1.0)) * 0.5;

  // Clamp to prevent sampling outside
  let clampedUV = clamp(warpedUV, vec2<f32>(0.0), vec2<f32>(1.0));

  return textureSample(iChannel0, iChannel0Sampler, clampedUV);
}
