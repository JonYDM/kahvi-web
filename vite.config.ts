import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "node:path";

// Configuración de Vite.
// - Alias "@" → src (imports limpios).
// - Proxy /api → backend kahvi-api local en desarrollo.
// - PWA: manifest + service worker (instalable). NO cachea /api (datos con auth).
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "apple-touch-icon.png", "*.webp"],
      manifest: {
        name: "Kahvi — Tu cafeteria, en buenas manos",
        short_name: "Kahvi",
        description: "POS y gestion para cafeterias. Mesero, cocina y caja en una sola app.",
        theme_color: "#2B1F19",
        background_color: "#FDFAF6",
        display: "standalone",
        display_override: ["standalone", "minimal-ui"],
        orientation: "portrait",
        lang: "es-MX",
        start_url: "/",
        scope: "/",
        id: "kahvi-app",
        categories: ["business", "productivity", "food"],
        screenshots: [],
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "pwa-512x512-maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
        shortcuts: [
          {
            name: "Nueva comanda",
            short_name: "Comanda",
            url: "/mesero",
            icons: [{ src: "pwa-192x192.png", sizes: "192x192" }],
          },
          {
            name: "Cocina",
            short_name: "Cocina",
            url: "/cocina",
            icons: [{ src: "pwa-192x192.png", sizes: "192x192" }],
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,webp,woff2}"],
        navigateFallbackDenylist: [/^\/api/],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-stylesheets",
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-webfonts",
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "query-vendor": ["@tanstack/react-query"],
          "ui-vendor": ["vaul", "react-hot-toast"],
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:5265",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
