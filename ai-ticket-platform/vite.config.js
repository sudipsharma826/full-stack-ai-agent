import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'


// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,     // listen on all addresses (0.0.0.0)
    port: 5173,
    watch: {
      usePolling: true, // 👈 Required for Docker volume changes to be detected
    }     // optional, just to be explicit
  }
})
