/*
 * SPDX-License-Identifier: GPL-3.0-only
 *
 * SplitShade: WebGPU Playground
 * Copyright (C) 2025 Anu Kriti Wadhwa
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

/**
 * WebGPU Shader Management and Compilation
 *
 * This module provides shader templates, compilation utilities, and error handling
 * for WebGPU WGSL shaders in the shader playground environment.
 */

/**
 * Fullscreen triangle vertex shader for fragment shader development.
 *
 * Creates a triangle that covers the entire screen using only vertex indices.
 * No vertex buffers required - positions generated procedurally.
 */
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

/**
 * Minimal uniform header for basic fragment shaders.
 *
 * Provides essential uniforms: resolution, time, and mouse coordinates.
 * Used when no texture channels are required.
 */
export const minimalHeader = `
@group(0) @binding(0) var<uniform> iResolution: vec3<f32>;
@group(0) @binding(1) var<uniform> iTime: f32;
@group(0) @binding(2) var<uniform> iMouse: vec4<f32>;
`;

/**
 * Texture binding declarations for all four iChannel slots.
 *
 * Defines texture and sampler bindings for iChannel0-3 compatibility.
 * Each channel requires both a texture and sampler binding.
 */
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

/**
 * Complete header with uniforms and texture bindings.
 *
 * Combines minimal header with all texture channel declarations.
 * Injected automatically when textures are detected in shader code.
 */
export const injectedHeader = minimalHeader + textureBindings;

/**
 * Result structure for shader compilation operations.
 */
interface CompilationResult {
  /** Compiled shader module (null if compilation failed) */
  module: GPUShaderModule | null;
  /** Detailed error information with adjusted line numbers */
  errors: Array<{
    message: string;
    line: number;
    column: number;
    type: string;
    offset: number;
    length: number;
  }>;
  /** Whether compilation encountered any errors */
  hasErrors: boolean;
}

/**
 * Compiles WGSL shader code into a WebGPU shader module.
 *
 * Handles compilation, error collection, and line number adjustment
 * to account for injected headers in user shader code.
 *
 * @param device - WebGPU device instance
 * @param code - Complete WGSL shader source including headers
 * @param headerUsed - The header that was prepended to user code (for line number adjustment)
 *
 * @returns Promise resolving to compilation result with module and errors
 *
 * @remarks
 * - Automatically adjusts error line numbers to match user code
 * - Provides detailed diagnostic information for debugging
 * - Returns null module if compilation fails with errors
 * - Logs comprehensive compilation messages to console for development
 */
export async function compileShaderModule(device: GPUDevice, code: string, headerUsed?: string): Promise<CompilationResult> {
  const module = device.createShaderModule({ code });

  // Get diagnostic info
  const info = await module.getCompilationInfo();

  // Calculate header offset to adjust line numbers for user code
  // If headerUsed is provided, count its lines plus the newline separator
  const headerOffset = headerUsed ? headerUsed.split('\n').length : 0;

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