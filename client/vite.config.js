import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  }, // <--- Resolve ends here
  server: { // <--- Server should be its own top-level property
    host: "0.0.0.0",
    port: 5000,
    allowedHosts: true,
  },
})