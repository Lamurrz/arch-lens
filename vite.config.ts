import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Set VITE_BASE_PATH in your GitHub Actions workflow or .env.production
// e.g. VITE_BASE_PATH=/arch-lens/ for a repo named arch-lens
const base = process.env.VITE_BASE_PATH || "/";

export default defineConfig({
  plugins: [react()],
  base,
  build: {
    outDir: "dist",
    sourcemap: true,
  },
  define: {
    // Expose backend URL for when FastAPI is wired in
    "import.meta.env.VITE_BACKEND_URL": JSON.stringify(
      process.env.VITE_BACKEND_URL || "http://localhost:8000"
    ),
  },
});
