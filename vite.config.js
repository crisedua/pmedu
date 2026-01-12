import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/ -- restart trigger

export default defineConfig({
  plugins: [react()],
})
