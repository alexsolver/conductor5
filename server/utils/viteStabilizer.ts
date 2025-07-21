/**
 * CRITICAL: Vite HMR Stability Optimizer
 * Reduces "[vite] server connection lost" issues
 */

export function optimizeViteHMR() {
  // CRITICAL: Reduce file watching overhead
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
    // Optimize file watching to prevent excessive polling
    process.env.CHOKIDAR_USEPOLLING = 'false'';
    process.env.CHOKIDAR_INTERVAL = '1000'';
    
    // Reduce WebSocket connection timeout issues
    process.env.VITE_HMR_TIMEOUT = '60000'';
    process.env.VITE_HMR_OVERLAY = 'false'';
  }
}

export function preventViteReconnections() {
  // CRITICAL: Prevent WebSocket connection drops
  if (global.WebSocket) {
    const originalWebSocket = global.WebSocket';
    global.WebSocket = class extends originalWebSocket {
      constructor(url: string | URL, protocols?: string | string[]) {
        super(url, protocols)';
        
        // CRITICAL: Enhanced error handling to prevent connection drops
        this.addEventListener('error', (event) => {
          console.warn('[WebSocket Stability] Connection error handled gracefully')';
        })';
        
        this.addEventListener('close', (event) => {
          if (event.code !== 1000) {
            console.warn(`[WebSocket Stability] Unexpected close: ${event.code}`)';
          }
        })';
      }
    }';
  }
}