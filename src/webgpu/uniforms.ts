export function createUniforms(
  device: GPUDevice,
  canvas: HTMLCanvasElement,
  textureBindings: ({ textureView: GPUTextureView; sampler: GPUSampler } | null)[]
)
{
  const resolutionData = new Float32Array([
    canvas.width,
    canvas.height,
    1.0,
  ]);

  const timeData = new Float32Array([0.0]); // will update every frame

  const mouseData = new Float32Array([0.0, 0.0, 0.0, 0.0]);

  const resolutionBuffer = device.createBuffer({
    size: resolutionData.byteLength,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  const timeBuffer = device.createBuffer({
    size: timeData.byteLength,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  const mouseBuffer = device.createBuffer({
    size: mouseData.byteLength,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  device.queue.writeBuffer(resolutionBuffer, 0, resolutionData);
  device.queue.writeBuffer(timeBuffer, 0, timeData);
  device.queue.writeBuffer(mouseBuffer, 0, mouseData);

  const layoutEntries: GPUBindGroupLayoutEntry[] = [
      {
        binding: 0,
        visibility: GPUShaderStage.FRAGMENT,
        buffer: { type: "uniform" }
      },
      {
        binding: 1,
        visibility: GPUShaderStage.FRAGMENT,
        buffer: { type: "uniform" }
      },
      {
        binding: 2,
        visibility: GPUShaderStage.FRAGMENT,
        buffer: { type: "uniform" }
      }
  ];

  textureBindings.forEach((binding, i) => {
    if (!binding) return;
    const base = 3 + i * 2;
    layoutEntries.push({
      binding: base,
      visibility: GPUShaderStage.FRAGMENT,
      texture: { sampleType: 'float' }
    });
    layoutEntries.push({
      binding: base + 1,
      visibility: GPUShaderStage.FRAGMENT,
      sampler: { type: 'filtering' }
    });
  });

  const bindGroupLayout = device.createBindGroupLayout({
    entries: layoutEntries,
  });

  const entries: GPUBindGroupEntry[] = [
    { binding: 0, resource: { buffer: resolutionBuffer } },
    { binding: 1, resource: { buffer: timeBuffer } },
    { binding: 2, resource: { buffer: mouseBuffer } }
  ];

  textureBindings.forEach((binding, i) => {
    if (!binding) return;
    const base = 3 + i * 2;
    entries.push({
      binding: base,
      resource: binding.textureView,
    });
    entries.push({
      binding: base + 1,
      resource: binding.sampler,
    });
  });

  const bindGroup = device.createBindGroup({
    layout: bindGroupLayout,
    entries,
  });

  return { 
    bindGroupLayout,
    bindGroup,
    timeBuffer,
    startTime: performance.now(),
    mouseBuffer
  };
}