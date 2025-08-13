import { describe, it, expect } from 'vitest'
import { parseWGSL, parseWebGPUErrors, getHeaderLineOffset } from '@/webgpu/parser'

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

describe('getHeaderLineOffset', () => {
  it('returns 13 when textures are used (default)', () => {
    expect(getHeaderLineOffset()).toBe(13)
    expect(getHeaderLineOffset(true)).toBe(13)
  })
  it('returns 5 when textures are not used', () => {
    expect(getHeaderLineOffset(false)).toBe(5)
  })
})

describe('parseWebGPUErrors', () => {
  it('parses WebGPU compilation error and applies header offset', () => {
    const msg = `[error] L17:39 unresolved value 'undefinedVariable'`
    const headerOffset = 13
    const [err] = parseWebGPUErrors(msg, headerOffset)
    // 17 - 13 = 4
    expect(err.line).toBe(4)
    expect(err.column).toBe(39)
    expect(err.message).toContain('unresolved value')
  })

  it('parses parser-style error "Expected ... Line:X" without header offset', () => {
    const msg = `Expected ')' for argument list. Line:3`
    const [err] = parseWebGPUErrors(msg, 13)
    expect(err.line).toBe(3)        // no offset applied
    expect(err.column).toBeUndefined()
    expect(err.message).toMatch(/Expected.*argument list/i)
  })

  it('parses "L:C - error: message" with line+column', () => {
    const msg = `15:5 - error: missing ';'`
    const [err] = parseWebGPUErrors(msg, 13)
    expect(err.line).toBe(15)       // not a compilation pattern → no offset
    expect(err.column).toBe(5)
    expect(err.message).toMatch(/missing/i)
  })

  it('parses "error: ... at line N"', () => {
    const msg = `error: undeclared identifier 'foo' at line 4`
    const [err] = parseWebGPUErrors(msg, 13)
    expect(err.line).toBe(4)
    expect(err.message).toMatch(/undeclared identifier/i)
  })

  it('parses "at line N, column M: message"', () => {
    const msg = `at line 15, column 8: undeclared identifier`
    const [err] = parseWebGPUErrors(msg, 13)
    expect(err.line).toBe(15)
    expect(err.column).toBe(8)
    expect(err.message).toMatch(/undeclared identifier/i)
  })

  it('generic: no line numbers → returns line 1 with cleaned message', () => {
    const msg = `Detected shader type: fragment
WebGPU Error: Something went wrong in prelude`
    const [err] = parseWebGPUErrors(msg, 13)
    expect(err.line).toBe(1)
    // cleaned message should strip the "Detected shader type" preface
    expect(err.message).toMatch(/Something went wrong/i)
  })
})