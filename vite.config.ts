// ============================================================================
// FILE: vite.config.ts
// PURPOSE: Secure Vite configuration without API key exposure
// ============================================================================

import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
    proxy: {
      // Proxy API calls to Netlify Functions during development
      '/api': {
        target: 'http://localhost:8888/.netlify/functions',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  plugins: [react()],
  

  
  resolve: {
    alias: {
      '@': path.resolve('.'),
    }
  },
  
  // Production build optimizations
  build: {
    // Code splitting for better performance
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom'],
          'charts': ['recharts'],
          'icons': ['lucide-react']
        }
      }
    },
    // Minify and optimize
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
      }
    },
    // Source maps for debugging (optional)
    sourcemap: false, // Set to true if you need debugging in production
  },
  
  // Environment variable prefix (only VITE_ vars are exposed to client)
  envPrefix: 'VITE_',
});