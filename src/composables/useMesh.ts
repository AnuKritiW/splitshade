import { ref, reactive } from 'vue'
import { parseObjToVertices } from '../utils/objParser'

export function useMesh() {
  const showMeshModal = ref(false)

  const uploadedMesh = reactive({
    name: '',
    content: '',                            // raw .obj text
    vertexData: null as Float32Array | null // parsed vertex buffer
  })

  const presetMeshes = [
    'triangle.obj',
    'sphere.obj',
    'circle.obj'
  ]

  function openMeshModal() {
    showMeshModal.value = true
  }

  function removeMesh() {
    uploadedMesh.name = ''
    uploadedMesh.content = ''
    uploadedMesh.vertexData = null
  }

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
