import { initWebGPU } from '../webgpu/renderer'

type ChannelMap = {
  iChannel0: string | null
  iChannel1: string | null
  iChannel2: string | null
  iChannel3: string | null
}

export function useShaderRunner() {
  function runShader({
    canvas,
    code,
    textures,
    mesh,
    onLog,
  }: {
    canvas: HTMLCanvasElement,
    code: string,
    textures: Record<string, string>,
    mesh: Float32Array | null,
    onLog: (msg: string) => void
  }) {
    const strictTextures: ChannelMap = {
      iChannel0: textures.iChannel0 ?? null,
      iChannel1: textures.iChannel1 ?? null,
      iChannel2: textures.iChannel2 ?? null,
      iChannel3: textures.iChannel3 ?? null,
    }

    initWebGPU(canvas, code, strictTextures, onLog, mesh)
  }

  return { runShader }
}
