import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    // Load env file based on `mode` in the current working directory.
    // Use path.resolve('.') instead of process.cwd() to avoid TypeScript errors regarding Process types
    const env = loadEnv(mode, path.resolve('.'), '');
    
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        // Safe injection of environment variables
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY || ''),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || '')
      },
      resolve: {
        alias: {
          // Use path.resolve('.') to resolve root directory, avoiding __dirname issues in some environments
          '@': path.resolve('.'),
        }
      },
      build: {
        // Increase chunk size warning limit to suppress non-critical warnings
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
            output: {
                // Manual chunking to improve cacheability and loading
                manualChunks: {
                    vendor: ['react', 'react-dom', 'react-router-dom', 'recharts', 'lucide-react'],
                    genai: ['@google/genai']
                }
            }
        }
      }
    };
});