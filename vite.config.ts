import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Create a chunk for node_modules to keep vendor code separate
          if (id.includes('node_modules')) {
            return 'vendor'; // This creates a vendor chunk for all node_modules
          }
          // You can add more conditions for other custom chunks
        },
      },
    },
    chunkSizeWarningLimit: 1000, // Set the chunk size warning limit to 1000 kB
  },
});
