import ObjFileParser from 'obj-file-parser'

/**
 * Parses a raw .obj file string and converts it to a flat Float32Array suitable for WebGPU vertex buffers.
 *
 * The output format is interleaved position and color data: [x, y, z, r, g, b, x, y, z, r, g, b, ...]
 * Each vertex gets a default white color (1.0, 1.0, 1.0) since .obj files typically don't include color data.
 *
 * @param objText - Raw .obj file content as a string
 * @returns Float32Array with interleaved vertex positions and colors, ready for GPU upload
 *
 * @remarks
 * - Uses obj-file-parser library to handle the parsing
 * - Only processes the first model in multi-model .obj files
 * - Face indices are converted from 1-based (OBJ format) to 0-based (array indices)
 * - Returns empty array if no valid faces are found
 */
export function parseObjToVertices(objText: string): Float32Array {
//   console.log("objText", objText)
  const parser = new ObjFileParser(objText)
  const parsed = parser.parse()
  const vertices: number[] = []
  const { vertices: v, faces } = parsed.models[0]

  for (const face of faces) {
    for (const vertex of face.vertices) {
      const pos = v[vertex.vertexIndex - 1]
      if (!pos) continue

      vertices.push(pos.x, pos.y, pos.z)
      vertices.push(1.0, 1.0, 1.0) // default white color
    }
  }

  return new Float32Array(vertices)
}
