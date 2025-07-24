import { describe, it, expect } from 'vitest'
import { parseObjToVertices } from '@/utils/objParser'

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
})
