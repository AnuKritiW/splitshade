import { initWebGPU } from '@/runtime/renderer'

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
    onStructuredErrors,
  }: {
    canvas: HTMLCanvasElement,
    code: string,
    textures: Record<string, string>,
    mesh: Float32Array | null,
    onLog: (msg: string) => void,
    onStructuredErrors?: (errors: Array<{
      message: string;
      line: number;
      column: number;
      type: string;
      offset: number;
      length: number;
    }>) => void
  }) {
    const strictTextures: ChannelMap = {
      iChannel0: textures.iChannel0 ?? null,
      iChannel1: textures.iChannel1 ?? null,
      iChannel2: textures.iChannel2 ?? null,
      iChannel3: textures.iChannel3 ?? null,
    }

    initWebGPU(canvas, code, strictTextures, onLog, onStructuredErrors, mesh)
  }

  return { runShader }
}
