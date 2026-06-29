import { defineConfig } from "vitest/config";
import path from "node:path";

// Mirror the Next.js `@/*` path alias so tests import the same way app code does.
export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
});
