export const fullscreenVertexWGSL = `
@vertex
fn main(@builtin(vertex_index) vertexIndex : u32) -> @builtin(position) vec4<f32> {
  var pos = array<vec2<f32>, 3>(
    vec2<f32>(-1.0, -3.0),
    vec2<f32>(3.0, 1.0),
    vec2<f32>(-1.0, 1.0)
  );
  return vec4<f32>(pos[vertexIndex], 0.0, 1.0);
}
`;

export const injectedHeader = `
@group(0) @binding(0) var<uniform> iResolution: vec3<f32>;
@group(0) @binding(1) var<uniform> iTime: f32;
@group(0) @binding(2) var<uniform> iMouse: vec4<f32>;
@group(0) @binding(3) var iChannel0: texture_2d<f32>;
@group(0) @binding(4) var iChannel0Sampler: sampler;
@group(0) @binding(5) var iChannel1: texture_2d<f32>;
@group(0) @binding(6) var iChannel1Sampler: sampler;
@group(0) @binding(7) var iChannel2: texture_2d<f32>;
@group(0) @binding(8) var iChannel2Sampler: sampler;
@group(0) @binding(9) var iChannel3: texture_2d<f32>;
@group(0) @binding(10) var iChannel3Sampler: sampler;
`;

// TODO: use this abstracted value in injectedHeader
export const minimalHeader = `
@group(0) @binding(0) var<uniform> iResolution: vec3<f32>;
@group(0) @binding(1) var<uniform> iTime: f32;
@group(0) @binding(2) var<uniform> iMouse: vec4<f32>;
`;

export async function compileShaderModule(device: GPUDevice, code: string, output: (msg: string) => void) {
  const module = device.createShaderModule({ code });

  // Get diagnostic info
  const info = await module.getCompilationInfo();
  if (info.messages.length > 0) {
    const formatted = info.messages.map(m => {
      const where = `L${m.lineNum}:${m.linePos}`;
      return `[${m.type}] ${where} ${m.message}`;
    }).join("\n");
    output(formatted);
    if (info.messages.some(m => m.type === "error")) return null;
  }
  return module;
}