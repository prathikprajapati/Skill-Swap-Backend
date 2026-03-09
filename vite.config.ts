import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    // Dedupe ensures only one copy of React is ever resolved, preventing
    // the 'Invalid hook call' error that happens with multiple React instances.
    // Both framer-motion and motion depend on React and must share the same copy.
    dedupe: ['react', 'react-dom', 'react-router', 'framer-motion', 'motion'],
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
      // Force single React instance across all deps
      'react': path.resolve(__dirname, './node_modules/react'),
      'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],

  // Build optimizations
  build: {
    // Enable rollup code splitting
    rollupOptions: {
      output: {
        // Manual chunks for better caching
        manualChunks: {
          // React and related libraries
          'react-vendor': ['react', 'react-dom', 'react-router'],
          // Animation libraries
          'animation': ['motion', 'gsap'],
          // UI components
          'ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select'],
          // Icons
          'icons': ['lucide-react'],
        },
      },
    },
    // Minify with esbuild (faster than terser)
    minify: 'esbuild',
    // Generate source maps for production (set to false for smaller bundles)
    sourcemap: false,
    // Chunk size warning limit
    chunkSizeWarningLimit: 1000,
  },

  // Optimize dependencies - cache already cleared
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router', 'motion', 'framer-motion'],
  },
})

