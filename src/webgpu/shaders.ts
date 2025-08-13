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

export const minimalHeader = `
@group(0) @binding(0) var<uniform> iResolution: vec3<f32>;
@group(0) @binding(1) var<uniform> iTime: f32;
@group(0) @binding(2) var<uniform> iMouse: vec4<f32>;
`;

const textureBindings = `
@group(0) @binding(3) var iChannel0: texture_2d<f32>;
@group(0) @binding(4) var iChannel0Sampler: sampler;
@group(0) @binding(5) var iChannel1: texture_2d<f32>;
@group(0) @binding(6) var iChannel1Sampler: sampler;
@group(0) @binding(7) var iChannel2: texture_2d<f32>;
@group(0) @binding(8) var iChannel2Sampler: sampler;
@group(0) @binding(9) var iChannel3: texture_2d<f32>;
@group(0) @binding(10) var iChannel3Sampler: sampler;
`;

export const injectedHeader = minimalHeader + textureBindings;

export interface CompilationResult {
  module: GPUShaderModule | null;
  errors: Array<{
    message: string;
    line: number;
    column: number;
    type: string;
    offset: number;
    length: number;
  }>;
  hasErrors: boolean;
}

export async function compileShaderModule(device: GPUDevice, code: string): Promise<CompilationResult> {
  const module = device.createShaderModule({ code });

  // Get diagnostic info
  const info = await module.getCompilationInfo();

  // Calculate header offset to adjust line numbers for user code
  const headerLines = code.split('\n').findIndex(line => line.trim().startsWith('@fragment') || line.trim().startsWith('@vertex') || line.trim().startsWith('fn '));
  const headerOffset = headerLines > 0 ? headerLines : 0;

  const structuredErrors = info.messages.map(m => ({
    message: m.message,
    line: Math.max(1, m.lineNum - headerOffset), // Adjust line numbers to user code
    column: m.linePos,
    type: m.type,
    offset: m.offset,
    length: m.length
  }));

  const hasErrors = info.messages.some(m => m.type === "error");

  if (info.messages.length > 0) {
    // Enhanced debug output - log each message type
    console.log('=== WebGPU Compilation Messages ===');
    info.messages.forEach((m, i) => {
      console.log(`Message ${i + 1}:`);
      console.log(`  Type: "${m.type}"`);
      console.log(`  Line: ${m.lineNum}, Column: ${m.linePos}`);
      console.log(`  Message: "${m.message}"`);
      console.log('---');
    });
    console.log('=== End Messages ===');

    // Structured errors will handle display - no need for manual output
  }  return {
    module: hasErrors ? null : module,
    errors: structuredErrors,
    hasErrors
  };
}