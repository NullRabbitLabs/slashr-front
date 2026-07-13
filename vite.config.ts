import { reactRouter } from "@react-router/dev/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import { defineConfig } from "vite";
import path from "node:path";

export default defineConfig({
  plugins: [
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    reactRouter(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "app"),
    },
  },
});
