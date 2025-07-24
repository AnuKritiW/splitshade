/**
 * GPU context singleton.
 * 
 * This module ensures that only one GPUAdapter and GPUDevice are created and shared 
 * across the application. Multiple imports will reuse the same device instance.
 */

let device: GPUDevice | null = null;
let adapter: GPUAdapter | null = null;

export async function getWebGPUDevice(): Promise<{ device: GPUDevice | null, adapter: GPUAdapter | null }> {
  if (device && adapter) return { device, adapter };

  if (!navigator.gpu) {
    console.error("WebGPU not supported.");
    return { device: null, adapter: null };
  }

  adapter = await navigator.gpu.requestAdapter();
  if (!adapter) {
    console.error("Failed to get GPU adapter");
    return { device: null, adapter: null };
  }

  device = await adapter.requestDevice();
  if (!device) {
    console.error("Failed to get GPU device");
    return { device: null, adapter: null };
  }

  console.log("Got GPU device:", device);
  return { device, adapter };
}

export function configureCanvasContext(canvas: HTMLCanvasElement, device: GPUDevice) {
  const context = canvas.getContext("webgpu")
  if (!context) {
    throw new Error('WebGPU context is not available on the provided canvas.')
  }

  const format = navigator.gpu.getPreferredCanvasFormat();
  context.configure({
    device,
    format,
    alphaMode: "opaque",
  });
  return { context, format };
}