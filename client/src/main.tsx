import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./i18n";
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
createRoot(document.getElementById("root")!).render(<App />);
