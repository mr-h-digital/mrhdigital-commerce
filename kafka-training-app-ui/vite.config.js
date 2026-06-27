import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Original kafka-training-app (Dashboard tab)
      '/api/orders/messages': 'http://localhost:8081',

      // New microservices (Online Store tab — direct calls, no proxy needed)
      // product-service  : 8082
      // order-service    : 8083
      // notification-service : 8086

      // Original order producer (Dashboard tab)
      '/api/orders': 'http://localhost:8081'
    }
  }
})
