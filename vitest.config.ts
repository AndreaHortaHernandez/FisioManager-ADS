// Configuración de tests separada de vite.config.ts a propósito: vitest trae
// su propia copia de Vite, cuyos tipos chocan con los plugins de la app
// (@vitejs/plugin-react, @tailwindcss/vite) si se combinan en un solo archivo.
// Los tests son lógica pura — no necesitan esos plugins.
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['backend/**', 'node_modules/**'],
  },
});
