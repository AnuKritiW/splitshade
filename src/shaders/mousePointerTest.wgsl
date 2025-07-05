@group(0) @binding(0)
var<uniform> iResolution: vec3<f32>;

@group(0) @binding(1)
var<uniform> iTime: f32;

@group(0) @binding(2)
var<uniform> iMouse: vec4<f32>;

@fragment
fn main(@builtin(position) pos: vec4<f32>) -> @location(0) vec4<f32> {
  let uv = pos.xy / iResolution.xy;
  let mouseUV = iMouse.xy / iResolution.xy;

  let dist = distance(uv, mouseUV);
  let circle = smoothstep(0.05, 0.01, dist); // soft circular falloff

  let base = vec3<f32>(uv, 0.3);
  let highlight = vec3<f32>(1.0, 1.0, 1.0);

  let color = mix(base, highlight, circle);
  return vec4<f32>(color, 1.0);
}
