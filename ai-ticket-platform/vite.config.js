import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command, mode }) => {
  // Load environment variables from .env files
  const env = loadEnv(mode, process.cwd());

  console.log('=== Vite Build Debug ===');
  console.log('Command:', command);
  console.log('Mode:', mode);
  console.log('VITE_BACKEND_URL:', env.VITE_BACKEND_URL);

  return {
    plugins: [react()],
    server: {
      host: true,
      port: 5173,
      watch: {
        usePolling: true, // For Docker or WSL compatibility
      },
    },
  };
});
