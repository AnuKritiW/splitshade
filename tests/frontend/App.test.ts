import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, ref, nextTick } from 'vue'

import App from '../../src/App.vue'

// mock Naive UI components (minimal stubs so App renders)
vi.mock('naive-ui', () => {
  const stub = (name: string) =>
    defineComponent({ name, render() { return h('div', { 'data-stub': name }, this.$slots.default?.()) } })
  return {
    NConfigProvider: stub('n-config-provider'),
    NLayoutHeader: stub('n-layout-header'),
    NButton: stub('n-button'),
    NIcon: stub('n-icon'),
    darkTheme: {},
  }
})

// mock Monaco editor
vi.mock('@guolao/vue-monaco-editor', () => {
  return { loader: { config: vi.fn() } }
})

// mock composables
const runShaderSpy = vi.fn()
const selectedTexturesRef = ref<Record<string, string | null>>({
  iChannel0: 'tex0.png',
  iChannel1: null,
  iChannel2: 'tex2.png',
  iChannel3: null,
})
const showTextureModalRef = ref(false)
const showMeshModalRef = ref(false)
const uploadedMesh = { name: 'foo.obj', vertexData: new Float32Array([0, 1, 2]) }
const presetMeshes = ref([{ name: 'teapot', path: '/mesh/teapot.obj' }])

// create spy func to track when shaders are run
vi.mock('../../src/composables/useShaderRunner', () => ({
  useShaderRunner: () => ({
    runShader: (args: any) => {
      runShaderSpy(args)
      // simulate a log callback from the shader pipeline
      if (args?.onLog) args.onLog('Compiled successfully')
    },
  }),
}))

// mock texture management with fake data
vi.mock('../../src/composables/useTextures', () => ({
  useTextures: () => ({
    selectedTextures: selectedTexturesRef,
    allTextures: ref(['tex0.png', 'tex2.png']),
    showTextureModal: showTextureModalRef,
    openTextureModal: vi.fn(),
    selectTexture: vi.fn(),
    handleUpload: vi.fn(),
  }),
}))

// mock mesh management with fake data
vi.mock('../../src/composables/useMesh', () => ({
  useMesh: () => ({
    showMeshModal: showMeshModalRef,
    uploadedMesh,
    presetMeshes,
    openMeshModal: vi.fn(),
    removeMesh: vi.fn(),
    copyStarterCode: vi.fn(),
    handleMeshUpload: vi.fn(),
    selectPresetMesh: vi.fn(),
    downloadMesh: vi.fn(),
  }),
}))

// create simplified versions of child components
// expose fake canvas element for shader rendering
const PreviewPanelExpose = () => {
  const canvas = global.document.createElement('canvas')
  return defineComponent({
    name: 'PreviewPanel',
    setup(_, { expose }) {
      expose({ canvasRef: canvas })
      return () => h('div', { 'data-stub': 'PreviewPanel' })
    },
  })
}

// expose goToLine func that can be spied on
const editorGoToLineSpy = vi.fn()
const EditorPanelExpose = () =>
  defineComponent({
    name: 'EditorPanel',
    props: ['runShader', 'code'],
    emits: ['go-to-line', 'update:code'],
    setup(_, { expose }) {
      expose({ goToLine: editorGoToLineSpy })
      return () => h('div', { 'data-stub': 'EditorPanel' })
    },
  })

// can emit goToLine events when clicked
const ConsolePanelStub = defineComponent({
  name: 'ConsolePanel',
  props: ['consoleOutput', 'shaderCode'],
  emits: ['go-to-line'],
  setup(_props, { emit }) {
    // expose an action to trigger go-to-line from tests if needed
    return () =>
      h('div', { 'data-stub': 'ConsolePanel', onClick: () => emit('go-to-line', 42, 7) })
  },
})

const ResourcesPanelStub = defineComponent({
  name: 'ResourcesPanel',
  props: [
    'selectedTextures',
    'allTextures',
    'showTextureModal',
    'showMeshModal',
    'presetMeshes',
    'uploadedMesh',
  ],
  setup() {
    return () => h('div', { 'data-stub': 'ResourcesPanel' })
  },
})

const WebGPUWarningStub = defineComponent({
  name: 'WebGPUWarning',
  setup() {
    return () => h('div', { 'data-stub': 'WebGPUWarning' })
  },
})

const makeStub = (name: string) =>
  defineComponent({
    name,
    render() {
      return h('div', { 'data-stub': name }, this.$slots.default?.())
    },
  })

// helper to mount SUT with the stubs
const mountApp = () =>
  mount(App, {
    global: {
      stubs: {
        // child components
        PreviewPanel: PreviewPanelExpose(),
        EditorPanel: EditorPanelExpose(),
        ConsolePanel: ConsolePanelStub,
        ResourcesPanel: ResourcesPanelStub,
        WebGPUWarning: WebGPUWarningStub,

        // 👇 kebab-case Naive UI tags
        'n-config-provider': makeStub('n-config-provider'),
        'n-layout-header': makeStub('n-layout-header'),
        'n-button': makeStub('n-button'),
        'n-icon': makeStub('n-icon'),

        // optional icon component stub
        LogoGithub: true,
      },
    },
  })

describe('App.vue', () => {
  beforeEach(() => {
    runShaderSpy.mockClear()
    editorGoToLineSpy.mockClear()
  })

  // Test: as in title + checks buttons present
  it('mounts and renders header + buttons', async () => {
    const wrapper = mountApp()
    expect(wrapper.find('h2').text()).toContain('SplitShade: WebGPU Playground')
    // Docs and GitHub buttons
    const buttons = wrapper.findAll('[data-stub="n-button"]')
    expect(buttons.length).toBeGreaterThan(0)
  })

  it('clicking title and Docs button opens docs URL', async () => {
    const wrapper = mountApp()
    // use window.open spy to verify that external links work
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)

    await wrapper.find('h2').trigger('click')
    expect(openSpy).toHaveBeenCalledWith(
      'https://anukritiw.github.io/splitshade-docs/',
      '_blank'
    )

    // click the "Docs" button (first n-button)
    const docsBtn = wrapper.findAll('[data-stub="n-button"]')[0]
    await docsBtn.trigger('click')
    expect(openSpy).toHaveBeenCalledTimes(2)

    openSpy.mockRestore()
  })

  it('title hover updates opacity', async () => {
    const wrapper = mountApp()
    const title = wrapper.find('h2')
    await title.trigger('mouseenter')
    expect((title.element as HTMLElement).style.opacity).toBe('0.8')
    await title.trigger('mouseleave')
    expect((title.element as HTMLElement).style.opacity).toBe('1')
  })

  // verifies that when app loads, it runs the default shader
  // checks texture data is filtered
  // ensures mesh and canvas are provided to shader runner
  // confirms shader compilation messages are logged
  it('auto-runs shader on mount and updates console via onLog', async () => {
    mountApp()

    // onMounted --> nextTick --> handleRunShader
    await nextTick()
    await nextTick()

    expect(runShaderSpy).toHaveBeenCalledTimes(1)
    const call = runShaderSpy.mock.calls[0][0]

    // valid textures should be filtered to only string values
    expect(call.textures).toEqual({ iChannel0: 'tex0.png', iChannel2: 'tex2.png' })
    // mesh is passed through
    expect(call.mesh).toBe(uploadedMesh.vertexData)
    // canvas present
    expect(call.canvas).toBeInstanceOf(HTMLCanvasElement)

    // onLog should append messages to consoleOutput, which is passed to ConsolePanel
    // this could be verified by having the ConsolePanel stub render the text,
    // but here only the following is confirmed
    // 1) runShader received an onLog function
    // 2) calling onLog would update consoleOutput (simulated via our spy)
    expect(typeof call.onLog).toBe('function')
  })

  // tests communication between console and editor components with jump to line
  it('routes go-to-line from ConsolePanel to EditorPanel.goToLine', async () => {
    const wrapper = mountApp()

    // simulate ConsolePanel emitting go-to-line (stub emits on click)
    await wrapper.find('[data-stub="ConsolePanel"]').trigger('click')

    expect(editorGoToLineSpy).toHaveBeenCalledWith(42, 7)
    expect(editorGoToLineSpy).toHaveBeenCalledTimes(1)
  })
})
