import { ref, reactive } from 'vue'
import { parseObjToVertices } from '../../resources/mesh/objParser'

/**
 * Vue composable for managing 3D mesh uploads and preset meshes.
 *
 * Provides functionality for loading preset meshes, handling user uploads,
 * and generating appropriate shader starter code for mesh rendering.
 *
 * @returns Object containing mesh state and management functions
 *
 * @example
 * ```typescript
 * const { uploadedMesh, selectPresetMesh, copyStarterCode } = useMesh()
 *
 * // Load a preset mesh
 * selectPresetMesh('sphere.obj')
 *
 * // Copy starter code for vertex shaders
 * copyStarterCode()
 * ```
 */
export function useMesh() {
  /** Controls visibility of the mesh selection modal */
  const showMeshModal = ref(false)

  /**
   * Reactive object containing the currently loaded mesh data.
   * Includes both raw .obj content and parsed vertex data for GPU upload.
   */
  const uploadedMesh = reactive({
    /** Display name of the loaded mesh file */
    name: '',
    /** Raw .obj file content as text */
    content: '',
    /** Parsed vertex data ready for WebGPU vertex buffer */
    vertexData: null as Float32Array | null
  })

  /** Array of available preset mesh filenames */
  const presetMeshes = [
    'triangle.obj',
    'sphere.obj',
    'circle.obj'
  ]

  /**
   * Opens the mesh selection modal.
   */
  function openMeshModal() {
    showMeshModal.value = true
  }

  /**
   * Clears the currently loaded mesh data.
   */
  function removeMesh() {
    uploadedMesh.name = ''
    uploadedMesh.content = ''
    uploadedMesh.vertexData = null
  }

  /**
   * Copies vertex shader starter code to the clipboard.
   *
   * Provides a complete vertex+fragment shader template that works
   * with uploaded mesh data, including proper attribute bindings.
   */
  function copyStarterCode() {
    const defaultCode = `
// Default shader code for uploaded mesh
struct VertexOut {
  @builtin(position) position: vec4<f32>,
  @location(0) color: vec3<f32>,
};

@vertex
fn main(@location(0) pos: vec3<f32>, @location(1) color: vec3<f32>) -> VertexOut {
  var out: VertexOut;
  // Adjust as needed to ensure the object is in clip space and in front of the camera
  out.position = vec4<f32>(pos, 1.0);
  out.color = color;
  return out;
}

@fragment
fn main_fs(@location(0) color: vec3<f32>) -> @location(0) vec4<f32> {
  return vec4<f32>(color, 1.0);
}
`.trim()

    navigator.clipboard.writeText(defaultCode)
      .then(() => console.log("Starter code copied to clipboard"))
      .catch(err => console.error("Failed to copy:", err))
  }

  /**
   * Handles mesh file uploads from the user.
   *
   * Reads the uploaded .obj file, parses it into vertex data,
   * and updates the uploadedMesh reactive object.
   *
   * @param params - Upload parameters containing file and onFinish callback
   */
  function handleMeshUpload({ file, onFinish }: any) {
    const reader = new FileReader()
    reader.onload = () => {
      const objText = reader.result as string
      uploadedMesh.name = file.name
      uploadedMesh.content = objText
      try {
        uploadedMesh.vertexData = parseObjToVertices(objText)
        console.log("Parsed vertex count:", uploadedMesh.vertexData.length / 6)
      } catch (e) {
        console.error("OBJ parsing failed:", e)
      }
      onFinish()
      console.log("Loaded OBJ content:", uploadedMesh.content.slice(0, 200), "...")
    }
    reader.readAsText(file.file)
  }

  /**
   * Loads a preset mesh from the server.
   *
   * Fetches the .obj file from the public mesh directory,
   * parses it, and updates the uploadedMesh state.
   *
   * @param meshName - Filename of the preset mesh to load
   */
  function selectPresetMesh(meshName: string) {
    fetch(`/splitshade/mesh/${meshName}`)
      .then(res => res.text())
      .then(content => {
        uploadedMesh.name = meshName
        uploadedMesh.content = content
        uploadedMesh.vertexData = parseObjToVertices(content)
        console.log(`Loaded preset mesh: ${meshName}`)
      })
      .catch(err => console.error("Failed to load preset mesh:", err))

    showMeshModal.value = false
  }

  /**
   * Downloads a preset mesh file to the user's computer.
   *
   * Creates a temporary download link and triggers the browser's
   * download mechanism for the specified mesh file.
   *
   * @param meshName - Filename of the mesh to download
   */
  function downloadMesh(meshName: string) {
    if (!meshName) return
    const link = document.createElement('a')
    link.href = `/splitshade/mesh/${meshName}`
    link.download = meshName
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return {
    showMeshModal,
    uploadedMesh,
    presetMeshes,
    openMeshModal,
    removeMesh,
    copyStarterCode,
    handleMeshUpload,
    selectPresetMesh,
    downloadMesh
  }
}
