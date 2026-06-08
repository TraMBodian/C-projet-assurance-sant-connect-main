import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  appType: "spa",
  server: {
    host: "0.0.0.0",
    port: 8080,
    hmr: {
      overlay: false,
    },
    watch: {
      usePolling: true,
      interval: 300,
    },
    proxy: {
      "/api": {
        target: process.env.VITE_PROXY_TARGET ?? "http://localhost:3001",
        changeOrigin: true,
        secure: false,
      },
      "/ws": {
        target: process.env.VITE_PROXY_TARGET ?? "http://localhost:3001",
        changeOrigin: true,
        secure: false,
        ws: true,
        // SockJS fait des requêtes HTTP aussi (info, iframe, xhr, jsonp…)
        rewriteWsOrigin: true,
      },
    },
  },
  define: {
    global: "globalThis",
  },
  optimizeDeps: {
    include: ["react", "react-dom", "react-dom/client", "react-router-dom", "sockjs-client", "recharts"],
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
