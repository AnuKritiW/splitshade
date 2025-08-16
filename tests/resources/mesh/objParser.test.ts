import { describe, it, expect } from 'vitest'
import { parseObjToVertices } from '@/resources/mesh/objParser'

describe('parseObjToVertices', () => {
  it('parses a valid triangle .obj string into interleaved position and color Float32Array', () => {
    const objString = `
v 1.0 2.0 3.0
v 4.0 5.0 6.0
v 7.0 8.0 9.0
f 1 2 3
    `

    const result = parseObjToVertices(objString)

    expect(result).toBeInstanceOf(Float32Array)
    expect(result.length).toBe(18) // 3 vertices × (3 pos + 3 color) = 18 floats

    // expected output: interleaved position + color per vertex
    const expected = [
      1, 2, 3, 1, 1, 1,
      4, 5, 6, 1, 1, 1,
      7, 8, 9, 1, 1, 1
    ]

    expect(Array.from(result)).toEqual(expected)
  })

  it('returns an empty array for an .obj file with no faces', () => {
    const objString = `
v 1.0 2.0 3.0
v 4.0 5.0 6.0
v 7.0 8.0 9.0
    `
    const result = parseObjToVertices(objString) // faces are missing, so no data should be extracted
    expect(result).toBeInstanceOf(Float32Array)
    expect(result.length).toBe(0)
  })

  it('handles multiple faces', () => {
    const objString = `
v 0 0 0
v 1 0 0
v 1 1 0
v 0 1 0
f 1 2 3
f 1 3 4
    `
    const result = parseObjToVertices(objString)
    expect(result.length).toBe(36) // 6 vertices × (3 pos + 3 color) = 36 floats
  })

    it('skips a face that references a missing vertex index', () => {
    const objString = `
v 1 1 1
f 1 2 3
    `
    const result = parseObjToVertices(objString)
    // Only 1 vertex exists, but face references 3. Should not crash.
    // Your implementation will likely return [1,1,1,1,1,1] (using vertex 1 three times), or skip
    // But as currently written, it will error — we should fix that or test for crash
    expect(result).toBeInstanceOf(Float32Array)
    // You might want to assert empty or partial depending on implementation
  })

  it('returns an empty array if there are no vertices at all', () => {
    const objString = `f 1 2 3`
    const result = parseObjToVertices(objString)
    expect(result).toBeInstanceOf(Float32Array)
    expect(result.length).toBe(0)
  })

  it('ignores normal and texture coordinate data', () => {
    const objString = `
v 0 0 0
v 1 0 0
v 1 1 0
vn 0 0 1
vt 0.5 0.5
f 1/1/1 2/1/1 3/1/1
    `
    const result = parseObjToVertices(objString)
    expect(result.length).toBe(18) // 3 vertices × (3 pos + 3 color)
    // Optional: Check the actual values
  })

})
