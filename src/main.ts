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

/**
 * Application Entry Point
 *
 * Initializes the Vue 3 application with required dependencies and mounts
 * the root component. Sets up Naive UI component library and typography.
 */

import naive from 'naive-ui'
import { createApp } from 'vue'

import App from './App.vue'
import '@fontsource/lato/400.css'

/**
 * Creates and configures the Vue application instance.
 *
 * Sets up the main application with Naive UI component library
 * integration and mounts to the DOM root element.
 *
 * @remarks
 * - Uses Naive UI for consistent component styling and theming
 * - Includes Lato font for improved typography
 * - Mounts to '#app' element in index.html
 */
const app = createApp(App)
app.use(naive)
app.mount('#app')
