import { createRoot } from "react-dom/client";
import App from "./App.simple";

console.log("Main.tsx loading...");

const rootElement = document.getElementById("root");
console.log("Root element found:", !!rootElement);

if (rootElement) {
  const root = createRoot(rootElement);
  console.log("Creating React root...");
  try {
    root.render(<App />);
    console.log("App rendered successfully");
  } catch (error) {
    console.error("Error rendering App:", error);
  }
} else {
  console.error("Root element not found!");
}
