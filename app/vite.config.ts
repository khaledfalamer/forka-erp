import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The pages that are not moved yet (Hire, Board, careers copy, help), the logos, config.js and sw.js
// are copied next to the build by scripts/add_legacy.sh, so nothing here touches them.
export default defineConfig({
  plugins: [react()],
  publicDir: false,
  build: {
    outDir: 'dist', emptyOutDir: true, assetsDir: 'assets',
    // one page per app: the hub at /, Board at /boards/, Hire at /hiring/, Procurement at /procurement/
    rollupOptions: { input: { hub: 'index.html', board: 'boards/index.html', hire: 'hiring/index.html', proc: 'procurement/index.html' } },
  },
});
