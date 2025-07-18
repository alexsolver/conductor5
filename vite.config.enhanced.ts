/**
 * CRITICAL FIX: Enhanced Vite Configuration
 * Resolves WebSocket instability and HMR disconnections
 */

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  
  // CRITICAL: Enhanced server configuration for stability
  server: {
    // WebSocket stability enhancements
    hmr: {
      // CRITICAL: Use polling to prevent connection loss
      timeout: 30000, // 30 second timeout
      overlay: false, // Disable error overlay that can cause issues
      clientPort: 5173, // Explicit client port
    },
    
    // Connection stability
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
    
    // CRITICAL: Enhanced WebSocket configuration
    ws: {
      // Prevent WebSocket timeouts
      timeout: 60000, // 1 minute timeout
      ping: 30000, // 30 second ping interval
      pong: 5000, // 5 second pong timeout
    },
    
    // File watching optimizations
    watch: {
      // CRITICAL: Use polling for file watching stability
      usePolling: false, // Disable polling for performance
      interval: 1000, // 1 second intervals when polling
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/dist/**',
        '**/.cache/**',
        '**/tmp/**',
        '**/temp/**',
        '**/*.log',
        '**/*.tmp',
        '**/*.swp'
      ]
    },
    
    // Proxy stability
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        // CRITICAL: Enhanced proxy configuration
        timeout: 30000, // 30 second timeout
        proxyTimeout: 30000,
        configure: (proxy, options) => {
          // Enhanced error handling
          proxy.on('error', (err, req, res) => {
            console.warn('[Proxy Error]', err.code);
          });
          
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // Add keep-alive headers
            proxyReq.setHeader('Connection', 'keep-alive');
            proxyReq.setHeader('Keep-Alive', 'timeout=30');
          });
        }
      }
    }
  },
  
  // CRITICAL: Build optimizations
  build: {
    // Reduce build size
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu']
        }
      }
    }
  },
  
  // CRITICAL: Dependency optimization
  optimizeDeps: {
    // Force pre-bundling of problematic dependencies
    include: [
      'react',
      'react-dom',
      '@tanstack/react-query',
      'wouter',
      'zod'
    ],
    // Exclude problematic packages
    exclude: [
      'fsevents'
    ]
  },
  
  // Path resolution
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client/src"),
      "@shared": path.resolve(__dirname, "./shared"),
      "@assets": path.resolve(__dirname, "./attached_assets"),
    },
  },
  
  // CRITICAL: Environment-specific configurations
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
  },
  
  // Enhanced CSS processing
  css: {
    devSourcemap: true,
    preprocessorOptions: {
      scss: {
        additionalData: `@import "src/styles/variables.scss";`
      }
    }
  }
});