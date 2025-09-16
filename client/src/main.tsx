import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./i18n";
import { setupApiInterceptor } from './utils/apiInterceptor'
import { TokenRefresh } from './utils/tokenRefresh'

// Suppress ResizeObserver warnings globally
const originalConsoleError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === 'string' && 
    (args[0].includes('ResizeObserver loop') || 
     args[0].includes('ResizeObserver loop completed with undelivered notifications'))
  ) {
    return; // Suppress ResizeObserver warnings
  }
  originalConsoleError.apply(console, args);
};

// Configurar interceptor de API e refresh automático
setupApiInterceptor();
TokenRefresh.setupAutoRefresh();

createRoot(document.getElementById("root")!).render(<App />);