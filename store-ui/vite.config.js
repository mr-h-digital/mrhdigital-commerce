import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      // Spring Boot microservices
      '/api/products':  'http://localhost:8082',
      '/api/orders':    { target: 'http://localhost:8083', changeOrigin: true },
      '/api/inventory': 'http://localhost:8084',
      '/api/events':    'http://localhost:8086',

      // Keycloak — proxy all realm + admin calls to avoid CORS
      '/realms': {
        target: 'http://localhost:8180',
        changeOrigin: true
      },
      '/admin': {
        target: 'http://localhost:8180',
        changeOrigin: true
      }
    }
  }
})
