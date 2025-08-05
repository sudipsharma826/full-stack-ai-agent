import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')
  
  console.log('=== Vite Build Debug ===');
  console.log('Command:', command);
  console.log('Mode:', mode);
  console.log('VITE_BACKEND_URL from env:', env.VITE_BACKEND_URL);
  
  return {
    plugins: [react()],
    server: {
      host: true,     // listen on all addresses (0.0.0.0)
      port: 5173,
      watch: {
        usePolling: true, // 👈 Required for Docker volume changes to be detected
      }     // optional, just to be explicit
    },
    // Explicitly define environment variables
    define: {
      'import.meta.env.VITE_BACKEND_URL': JSON.stringify(env.VITE_BACKEND_URL),
    },
  }
})
