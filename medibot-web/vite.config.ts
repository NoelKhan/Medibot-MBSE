import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Use SWC instead of Babel for faster transpilation
      jsxRuntime: 'automatic'
    })
  ],
  // Optimize dependencies - pre-bundle heavy packages
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@mui/material',
      '@mui/icons-material',
      'axios',
      '@tanstack/react-query'
    ]
  },
  build: {
    // Use esbuild for faster builds (default but explicit)
    target: 'esnext',
    // Reduce bundle size
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk for React and related libraries
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // Material-UI chunk
          'mui-vendor': [
            '@mui/material',
            '@mui/icons-material',
            '@emotion/react',
            '@emotion/styled'
          ],
          // API and utilities chunk
          'api-vendor': ['axios', '@tanstack/react-query']
        }
      }
    },
    chunkSizeWarningLimit: 600,
    sourcemap: false,
    minify: 'esbuild', // esbuild is faster than terser
    // Reduce I/O operations
    reportCompressedSize: false
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
    // Speed improvements
    fs: {
      // Restrict file access to project root for security and speed
      strict: true
    },
    // Reduce overhead
    hmr: {
      overlay: false // Disable error overlay for faster HMR
    }
  },
  // Reduce resolution overhead
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  // Speed up initial server start
  cacheDir: 'node_modules/.vite'
})
