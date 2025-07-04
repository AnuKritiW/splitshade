@group(0) @binding(0)
var<uniform> iResolution: vec3<f32>;
@group(0) @binding(1)
var<uniform> iTime: f32;

@fragment
fn main(@builtin(position) pos: vec4<f32>) -> @location(0) vec4<f32> {
  let uv = pos.xy / iResolution.xy;
  let pulse = 0.5 + 0.5 * sin(iTime * 2.0 + uv.x * 10.0);
  return vec4<f32>(pulse, uv.y, 0.3, 1.0);
}
