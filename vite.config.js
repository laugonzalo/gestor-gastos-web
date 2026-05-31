import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', // Se actualiza sola si subís cambios
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'Gestor Pro - Finanzas',
        short_name: 'Gestor Pro',
        description: 'Tu sistema personal de control de gastos y presupuestos',
        theme_color: '#7a37f5',     // El violeta de la app
        background_color: '#1e1e1e', // El gris oscuro del fondo
        display: 'standalone',       // Hace que se vea como app nativa (sin barra del navegador)
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ]
})