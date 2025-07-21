import { WgslReflect } from 'wgsl_reflect';

export function parseWGSL(wgslCode: string) {
  try {
    const reflect = new WgslReflect(wgslCode);
    const entries = reflect.entry;

    const hasFragment = entries.fragment.length > 0;
    const hasVertex = entries.vertex.length > 0;
    const hasCompute = entries.compute.length > 0;

    if (hasFragment) {
      return {
        type: hasVertex ? 'vertex-fragment' : 'fragment-only',
        entryPoints: entries,
        valid: true,
        warnings: [
          ...(hasVertex && !hasFragment ? ['Note: vertex shader detected but no fragment.'] : []),
          ...(hasCompute ? ['Note: compute shader detected but ignored.'] : []),
        ],
      };
    } else {
      return {
        type: 'invalid',
        valid: false,
        message: 'A fragment shader entry point is required to render to screen.',
      };
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      type: 'error',
      valid: false,
      error: message,
    };
  }
}
