@group(0) @binding(0)
var<uniform> iResolution: vec3<f32>;

@fragment
fn main(@builtin(position) pos: vec4<f32>) -> @location(0) vec4<f32> {
  let uv = pos.xy / iResolution.xy;
  let center = vec2<f32>(0.5, 0.5);
  let radius = 0.2;
  let d = distance(uv, center);
  if (d < radius) {
    return vec4<f32>(1.0, 1.0, 1.0, 1.0);
  } else {
    return vec4<f32>(0.0, 0.0, 0.0, 1.0);
  };
}
