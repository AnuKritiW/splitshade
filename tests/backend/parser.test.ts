import { describe, it, expect } from 'vitest'
import { parseWGSL } from '@/webgpu/parser'

// Minimal valid fragment shader
const validFragmentOnly = `
@fragment
fn main() -> @location(0) vec4<f32> {
  return vec4<f32>(1.0);
}
`

// Valid vertex-fragment pair
const validVertexFragment = `
@vertex
fn vs_main(@builtin(vertex_index) VertexIndex: u32) -> @builtin(position) vec4<f32> {
  return vec4<f32>(0.0);
}

@fragment
fn fs_main() -> @location(0) vec4<f32> {
  return vec4<f32>(1.0);
}
`

// Valid compute shader (ignored by renderer)
const computeOnly = `
@compute @workgroup_size(1)
fn main() {
}
`

// Invalid WGSL (syntax error)
const invalidShader = `
@fragment
fn main( -> @location(0) vec4<f32> {
  return vec4<f32>(1.0);
}
`

describe('parseWGSL', () => {
  it('parses a valid fragment-only shader correctly', () => {
    const result = parseWGSL(validFragmentOnly)
    expect(result.valid).toBe(true)
    expect(result.type).toBe('fragment-only')
    expect(result.entryPoints!.fragment.length).toBeGreaterThan(0)
  })

  it('parses a valid vertex-fragment shader correctly', () => {
    const result = parseWGSL(validVertexFragment)
    expect(result.valid).toBe(true)
    expect(result.type).toBe('vertex-fragment')
    expect(result.entryPoints!.vertex.length).toBeGreaterThan(0)
    expect(result.entryPoints!.fragment.length).toBeGreaterThan(0)
  })

  it('returns an invalid result when no fragment shader is present', () => {
    const result = parseWGSL(computeOnly)
    expect(result.valid).toBe(false)
    expect(result.type).toBe('invalid')
    expect(result.message).toContain('fragment shader')
  })

  it('returns an error result for syntactically invalid WGSL', () => {
    const result = parseWGSL(invalidShader)
    expect(result.valid).toBe(false)
    expect(result.type).toBe('error')
    expect(result.error).toBeDefined() // an error message is present
  })
})
