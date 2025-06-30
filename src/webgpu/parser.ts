import { WgslReflect } from 'wgsl_reflect';

export function parseWGSL(wgslCode: string) {
  try {
    const reflect = new WgslReflect(wgslCode);
    const entries = reflect.entry;

    if (entries.compute.length > 0) {
      return { type: 'compute', entryPoints: entries.compute };
    } else if (entries.vertex.length > 0 && entries.fragment.length > 0) {
      return { type: 'render', entryPoints: { vertex: entries.vertex, fragment: entries.fragment } };
    } else {
      return { type: 'unknown', entryPoints: {} };
    }
  } catch (err) {
    return { type: 'error', error: err.message };
  }
}
