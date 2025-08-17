# SplitShade WebGPU Playground

[![Deploy to GitHub Pages](https://github.com/AnuKritiW/splitshade-webgpu-playground/actions/workflows/deploy.yml/badge.svg)](https://github.com/AnuKritiW/splitshade-webgpu-playground/actions/workflows/deploy.yml)
[![Check Vite Build](https://github.com/AnuKritiW/splitshade-webgpu-playground/actions/workflows/check-build.yml/badge.svg)](https://github.com/AnuKritiW/splitshade-webgpu-playground/actions/workflows/check-build.yml)
[![Run Unit Tests](https://github.com/AnuKritiW/splitshade-webgpu-playground/actions/workflows/check-tests.yml/badge.svg)](https://github.com/AnuKritiW/splitshade-webgpu-playground/actions/workflows/check-tests.yml)

![Vue.js](https://img.shields.io/badge/Vue.js-4FC08D?style=for-the-badge&logo=vue.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![WebGPU](https://img.shields.io/badge/WebGPU-FF6B35?style=for-the-badge&logo=webgl&logoColor=white)
![WGSL](https://img.shields.io/badge/WGSL-FF4B4B?style=for-the-badge&logo=shader&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Monaco Editor](https://img.shields.io/badge/Monaco_Editor-0078D4?style=for-the-badge&logo=visual-studio-code&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)

A powerful, interactive WebGPU shader playground built with Vue.js and TypeScript. Write, test, and experiment with WGSL shaders in real-time with an intuitive web-based IDE.

## [Live Demo](https://anukritiw.github.io/splitshade/)

<div align="center">
  <a href="https://anukritiw.github.io/splitshade/">
    <img src="assets/splitshade.png" alt="splitshade screenshot">
  </a>
</div>

## Features

- **Real-time Shader Preview** - See your WGSL shaders render instantly
- **Monaco Editor Integration** - Full-featured code editor with syntax highlighting
- **Texture Loading** - Import and apply custom textures to your shaders
- **Multiple Mesh Support** - Test shaders on various 3D models
- **Interactive Controls** - Real-time uniform manipulation
- **Responsive Design** - Works seamlessly across devices
- **Comprehensive Testing** - Test coverage with Vitest

## Architecture

The project follows a modular architecture with clear separation of concerns:

- **Frontend**: Vue 3 with Composition API and TypeScript
- **WebGPU Engine**: Custom renderer with pipeline management
- **Shader System**: WGSL parsing and uniform binding
- **Resource Management**: Texture and mesh loading utilities
- **Testing**: Comprehensive unit tests

## Technologies

| Category | Technologies |
|----------|-------------|
| **Frontend** | Vue.js 3, TypeScript, Naive UI |
| **Graphics** | WebGPU, WGSL Shaders |
| **Build Tools** | Vite, Vue TSC |
| **Code Editor** | Monaco Editor |
| **Testing** | Vitest, Testing Library |
| **Deployment** | GitHub Pages, GitHub Actions |

## Prerequisites

- **Node.js** 18+ 
- **Modern Browser** with WebGPU support (Chrome 113+, Firefox 120+)
- **GPU** compatible with WebGPU

## Installation

```bash
# Clone the repository
git clone https://github.com/AnuKritiW/splitshade-webgpu-playground.git

# Navigate to project directory
cd splitshade-webgpu-playground

# Install dependencies
npm install

# Start development server
npm run dev
```

## Usage

1. **Start the development server** with `npm run dev`
2. **Open your browser** to `http://localhost:5173`
3. **Write WGSL shaders** in the Monaco editor
4. **Select meshes and textures** from the resource panels
5. **Watch your creations** render in real-time!


## Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage
```

## Deployment

The project automatically deploys to GitHub Pages when changes are pushed to the main branch.

```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Manual deployment
npm run deploy
```

## Project Structure

```
src/
├── ui/                               # UI layer (Vue.js frontend)
│   ├── components/                   # Vue components
│   │   ├── panels/                   # Main application panels
│   │   │   ├── EditorPanel.vue       # Monaco shader editor
│   │   │   ├── PreviewPanel.vue      # WebGPU render canvas
│   │   │   ├── ResourcesPanel.vue    # Mesh/texture selector
│   │   │   └── ConsolePanel.vue      # Error/output display
│   │   ├── modals/                   # Modal dialogs
│   │   │   ├── TextureModal.vue      # Texture selection
│   │   │   └── MeshModal.vue         # Mesh selection
│   │   └── WebGPUWarning.vue         # Browser compatibility
│   ├── composables/                  # Vue composition functions
│   │   ├── useShaderRunner.ts        # Shader execution
│   │   ├── useTextures.ts            # Texture management
│   │   └── useMesh.ts                # Mesh handling
│   └── styles/                       # UI styling
│       └── app.css
├── core/                             # Core WebGPU setup
│   └── context.ts                    # Device/adapter management
├── runtime/                          # Rendering execution
│   └── renderer.ts                   # Main rendering engine
├── pipeline/                         # Rendering pipeline
│   ├── pipeline.ts                   # Render pipeline factory
│   └── uniforms.ts                   # Uniform buffer management
├── shader/                           # Shader processing
│   ├── shaderUtils.ts                # Shader compilation & templates
│   └── wgslReflect.ts                # WGSL parsing & reflection
└── resources/                        # Asset management
    ├── textures.ts                   # Texture loading & binding
    └── mesh/
        └── objParser.ts              # OBJ file parsing
```

## Links

- [Live Demo](https://anukritiw.github.io/splitshade/)
- [Documentation](https://anukritiw.github.io/splitshade-docs/)

---

<div align="center">
  Made with ❤️ by <a href="https://github.com/AnuKritiW">AnuKritiW</a>
</div>