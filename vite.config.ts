/// <reference types="node" />
import { defineConfig } from "vite"
import path from "path"
import { fileURLToPath } from "url"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  assetsInclude: ["**/*.svg", "**/*.csv"],
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8010",
        changeOrigin: true,
        secure: false,
      },
      "/storage": {
        target: "http://127.0.0.1:8010",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  css: {
    postcss: {},
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("react") || id.includes("react-dom") || id.includes("react-router")) {
              return "vendor-react";
            }
            if (id.includes("lucide-react")) {
              return "vendor-icons";
            }
            if (id.includes("recharts") || id.includes("d3")) {
              return "vendor-charts";
            }
            return "vendor";
          }
        }
      }
    }
  }
})
