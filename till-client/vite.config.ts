import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Proxy API calls to the Spring Boot backend during development so the
    // browser makes same-origin requests (no backend CORS needed yet).
    proxy: {
      '/ping': 'http://localhost:8080',
    },
  },
});
