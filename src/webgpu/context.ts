/**
 * WebGPU context management and device initialization.
 *
 * This module provides a singleton pattern for WebGPU device and adapter management,
 * ensuring only one instance is created and shared across the application.
 * Also handles canvas context configuration for rendering.
 */

let device: GPUDevice | null = null;
let adapter: GPUAdapter | null = null;

/**
 * Gets or initializes the WebGPU device and adapter.
 *
 * This function implements a singleton pattern - subsequent calls return the same
 * device and adapter instances. Handles WebGPU availability checks and error cases.
 *
 * @returns Promise resolving to an object with device and adapter (may be null if WebGPU unavailable)
 *
 * @remarks
 * - Returns cached instances on subsequent calls
 * - Logs errors to console when WebGPU is unavailable
 * - Both device and adapter will be null if WebGPU is not supported
 */
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

/**
 * Configures a canvas element for WebGPU rendering.
 *
 * Sets up the WebGPU context on the provided canvas with optimal settings
 * for the current platform and device.
 *
 * @param canvas - HTML canvas element to configure for WebGPU
 * @param device - WebGPU device instance to use for rendering
 * @returns Object containing the configured context and preferred format
 * @throws Error if the canvas doesn't support WebGPU context
 *
 * @remarks
 * - Uses the platform's preferred canvas format for optimal performance
 * - Sets alpha mode to "opaque" for better performance when transparency isn't needed
 */
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