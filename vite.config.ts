import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// VITE_BASE is "/" locally and "/<repository-name>/" on GitHub Pages (set by the deploy workflow).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  return { base: env.VITE_BASE || '/', plugins: [react()] }
})
