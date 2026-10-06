import { defineConfig, loadEnv } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

// Long video analysis can take minutes on CPU.
const PROXY_TIMEOUT_MS = 300000

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")

  // The browser talks to the dev server (same origin); these paths
  // are forwarded to the FastAPI backend.
  const backendProxy = {
    target: env.VITE_BACKEND_URL || "http://127.0.0.1:8000",
    changeOrigin: true,
    timeout: PROXY_TIMEOUT_MS,
    proxyTimeout: PROXY_TIMEOUT_MS,
  }

  const proxy = {
    "/api": backendProxy,
    "/health": backendProxy,
  }

  return {
    plugins: [
      react(),
      tailwindcss(),
    ],

    server: { proxy },
    preview: { proxy },

    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: "./src/test/setup.js",
    },
  }
})
