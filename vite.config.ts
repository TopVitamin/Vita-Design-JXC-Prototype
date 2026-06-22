import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    rollupOptions: {
      output: {
        // 把 vendor 依赖切出主 chunk，提升缓存命中与首屏并行加载
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "icons": ["lucide-react"],
        },
      },
    },
  },
});
