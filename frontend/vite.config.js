import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Permite acceder al dev server a través de túneles de Cloudflare.
    // El punto inicial acepta cualquier subdominio (los túneles rápidos cambian de nombre).
    allowedHosts: ['.trycloudflare.com'],
  },
})
