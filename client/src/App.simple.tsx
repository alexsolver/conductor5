export default function App() {
  console.log("App.tsx rendering...");
  
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Conductor - Sistema de Agenda</h1>
      <p>Teste de renderização básica funcionando!</p>
      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f0f0f0' }}>
        <h2>Status do Sistema:</h2>
        <ul>
          <li>✅ React está carregando</li>
          <li>✅ Componente App está renderizando</li>
          <li>🔄 Testando funcionalidade básica</li>
        </ul>
      </div>
    </div>
  );
}