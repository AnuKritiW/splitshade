import { useMesh } from '@/composables/useMesh'
import { vi } from 'vitest'
import { waitFor } from '@testing-library/vue'

// mock parseObjToVertices
vi.mock('@/utils/objParser', () => ({
  parseObjToVertices: vi.fn(() => new Float32Array([0, 0, 0, 1, 1, 1]))
}))

describe('useMesh', () => {
  beforeEach(() => {
    vi.clearAllMocks() // reset mocks before each test
  })

  // Test: Opening the mesh modal sets showMeshModal to true
  it('opens the mesh modal', () => {
    const { showMeshModal, openMeshModal } = useMesh()
    expect(showMeshModal.value).toBe(false)
    openMeshModal()
    expect(showMeshModal.value).toBe(true)
  })

  // Test: Removing an uploaded mesh resets the mesh data
  it('removes mesh data', () => {
    const { uploadedMesh, removeMesh } = useMesh()

    // Simulate an uploaded mesh
    uploadedMesh.name = 'test.obj'
    uploadedMesh.content = 'some content'
    uploadedMesh.vertexData = new Float32Array([1, 2, 3])

    removeMesh()

    // all fields should be reset
    expect(uploadedMesh.name).toBe('')
    expect(uploadedMesh.content).toBe('')
    expect(uploadedMesh.vertexData).toBeNull()
  })

  // Test: copyStarterCode copies starter code to clipboard
  it('copies starter code to clipboard', async () => {
    // mock navigator.clipboard.writeText
    const writeText = vi.fn(() => Promise.resolve())
    vi.stubGlobal('navigator', { clipboard: { writeText } })

    const { copyStarterCode } = useMesh()
    await copyStarterCode()

    expect(writeText).toHaveBeenCalled() // clipboard API should be called
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('@vertex'))
  })

  // Test: selectPresetMesh fetches and sets mesh data from a preset
  it('selects and loads a preset mesh', async () => {
    const mockObjData = 'v 0 0 0\nv 1 1 1\n'

    // Mock global fetch to simulate loading a mesh from a URL
    ;(globalThis as any).fetch = vi.fn(() =>
      Promise.resolve({ text: () => Promise.resolve(mockObjData) })
    )

    const { selectPresetMesh, uploadedMesh, showMeshModal } = useMesh()

    await selectPresetMesh('triangle.obj') // simulate selecting a preset mesh

    expect(fetch).toHaveBeenCalledWith('/splitshade/mesh/triangle.obj') // fetch should be called with the correct URL
    await waitFor(() => {
      expect(uploadedMesh.name).toBe('triangle.obj')
      expect(uploadedMesh.content).toBe(mockObjData)
      expect(uploadedMesh.vertexData).toBeInstanceOf(Float32Array)
    })
    expect(showMeshModal.value).toBe(false)
  })

  // Test: handleMeshUpload processes file upload and updates state
  it('uploads a mesh and parses vertex data', () => {
    const { uploadedMesh, handleMeshUpload } = useMesh()

    // Mock uploaded file and OBJ content
    const mockFile = new Blob(['v 0 0 0\nv 1 1 1\n'], { type: 'text/plain' })
    const mockName = 'upload.obj'
    const mockResult = 'v 0 0 0\nv 1 1 1\n'

    // Stub FileReader to simulate onload behavior
    const readAsText = vi.fn(function (this: FileReader) {
      (this as any).result = mockResult // simulate the result of reading the file
      this.onload?.({} as ProgressEvent<FileReader>)
    })

    vi.stubGlobal('FileReader', vi.fn(() => ({
      readAsText,
      onload: null,
      result: null,
    })))

    const onFinish = vi.fn()
    const mockUploadArg = { file: { file: mockFile, name: mockName }, onFinish }

    handleMeshUpload(mockUploadArg) // simulate uploading a mesh file

    expect(uploadedMesh.name).toBe(mockName)
    expect(uploadedMesh.content).toBe(mockResult)
    expect(uploadedMesh.vertexData).toBeInstanceOf(Float32Array)
    expect(onFinish).toHaveBeenCalled()
  })

  // Test: downloadMesh triggers a download of the mesh file
  it('triggers mesh download', () => {
    const { downloadMesh } = useMesh()

    // Mock DOM element and methods for <a> tag
    const mockClick = vi.fn()
    const mockAppend = vi.fn()
    const mockRemove = vi.fn()

    const mockLink = {
      click: mockClick, // simulate triggering download
      href: '',         // URL to the mesh file
      download: '',     // downloaded filename
      style: {},
    }

    // spy on document.createElement and return mock <a> tag
    const createElementSpy = vi
      .spyOn(document, 'createElement')
      .mockReturnValue(mockLink as unknown as HTMLAnchorElement)

    // spy on DOM manipulation
    vi.spyOn(document.body, 'appendChild')
      .mockImplementation(mockAppend)

    vi.spyOn(document.body, 'removeChild')
      .mockImplementation(mockRemove)

    downloadMesh('triangle.obj')

    // assert that the download was triggered correctly
    expect(createElementSpy).toHaveBeenCalledWith('a')
    expect(mockClick).toHaveBeenCalled()
    expect(mockAppend).toHaveBeenCalled()
    expect(mockRemove).toHaveBeenCalled()
  })
})
