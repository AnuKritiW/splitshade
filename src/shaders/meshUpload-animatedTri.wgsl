struct VertexOut {
  @builtin(position) position: vec4<f32>,
  @location(0) color: vec3<f32>,
};

@vertex
fn main(@location(0) pos: vec3<f32>, @location(1) color: vec3<f32>) -> VertexOut {
  var out: VertexOut;

  // Slight pulsing animation
  let pulse = 0.5 + 0.5 * sin(iTime + pos.x * 5.0);

  out.position = vec4<f32>(pos, 1.0);
  out.color = color * pulse; // animate brightness
  return out;
}

@fragment
fn main_fs(@location(0) color: vec3<f32>) -> @location(0) vec4<f32> {
  return vec4<f32>(color, 1.0);
}
