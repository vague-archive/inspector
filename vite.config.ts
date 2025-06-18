import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { isCustomElement } from "@vaguevoid/design-system/vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement,
        },
      },
    }),
  ],
  server: {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
      "Cross-Origin-Resource-Policy": "cross-origin",
    },
  },
  build: {
    sourcemap: true,
  },
});
