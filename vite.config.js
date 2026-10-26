import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  resolve: {
    alias: { "talaqa-i18n": new URL("./src/i18n", import.meta.url).pathname },
  },
  plugins: [react({ jsxImportSource: "talaqa-i18n" })],
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: { "/api": { target: "http://127.0.0.1:3001", changeOrigin: false } },
  },
});
