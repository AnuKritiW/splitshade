/*
 * SPDX-License-Identifier: GPL-3.0-only
 *
 * SplitShade: WebGPU Playground
 * Copyright (C) 2025 Anu Kriti Wadhwa
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

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
