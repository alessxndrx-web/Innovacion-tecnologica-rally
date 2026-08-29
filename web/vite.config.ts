import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    // El backend acepta este origen en CORS_ORIGINS por defecto.
    port: 5173,
  },
  preview: {
    // Mismo puerto que en desarrollo: por defecto `vite preview` usa el 4173,
    // que el backend rechazaría por CORS.
    port: 5173,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
