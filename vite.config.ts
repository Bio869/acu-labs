import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages serves the build under /<repo>/.
export default defineConfig({
  plugins: [react()],
  base: '/acu-labs/',
})
