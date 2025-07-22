import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./i18n";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

const root = createRoot(rootElement);

try {
  root.render(<App />);
} catch (error) {
  console.error("Failed to render app:", error);
  root.render(
    <div className="min-h-screen flex items-center justify-center bg-red-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Erro ao carregar aplicação</h1>
        <p className="text-gray-600 mb-4">Ocorreu um erro inesperado. Tente recarregar a página.</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Recarregar Página
        </button>
      </div>
    </div>
  );
}
