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
