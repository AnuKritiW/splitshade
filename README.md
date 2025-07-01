# SplitShade - a browser-based WebGPU Playground

This project is a work in progress. For now, I am storing some notes on my README as I go along.

## Developer Notes

This version of the playground enforces a ShaderToy-style execution model:
- Only fragment shaders are accepted from user input.
- A hardcoded fullscreen vertex shader is injected automatically at runtime.
- Fragment shaders are compiled and run over the entire canvas using a triangle covering the full screen.
- Vertex and compute entry points are still detected (via `wgsl_reflect`), but are ignored and warned about in the console.

This setup ensures that users can write fragment shaders without having to define vertex logic or pipeline configuration.
