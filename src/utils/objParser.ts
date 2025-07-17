import ObjFileParser from 'obj-file-parser'

/**
 * Parses a raw .obj file string and returns a flat Float32Array
 * of interleaved position and color values.
 */
export function parseObjToVertices(objText: string): Float32Array {
  console.log("objText", objText)
  const parser = new ObjFileParser(objText)
  const parsed = parser.parse()
  const vertices: number[] = []
  const { vertices: v, faces } = parsed.models[0]

  for (const face of faces) {
    console.log("face", face)
    for (const vertex of face.vertices) {
      console.log("v[vertex.vertexIndex]", v[vertex.vertexIndex - 1])
      const pos = v[vertex.vertexIndex - 1]
      vertices.push(pos.x, pos.y, pos.z)
      vertices.push(1.0, 1.0, 1.0) // default white color
    }
  }

  return new Float32Array(vertices)
}
