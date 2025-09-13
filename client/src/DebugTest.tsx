import { useState } from 'react';

export default function DebugTest() {
  const [clicks, setClicks] = useState(0);
  const [text, setText] = useState('');

  return (
    <div 
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100vw', 
        height: '100vh', 
        backgroundColor: 'red', 
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '20px'
      }}
    >
      <h1 style={{ fontSize: '2rem', color: 'white' }}>🔧 TESTE DE DEBUG</h1>
      
      <button 
        onClick={() => setClicks(c => c + 1)}
        style={{ 
          padding: '20px 40px', 
          fontSize: '1.5rem', 
          backgroundColor: 'white', 
          border: 'none', 
          borderRadius: '8px',
          cursor: 'pointer'
        }}
      >
        CLIQUE AQUI ({clicks})
      </button>

      <input 
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Digite aqui..."
        style={{ 
          padding: '15px', 
          fontSize: '1.2rem', 
          width: '300px',
          border: '2px solid white',
          borderRadius: '8px'
        }}
      />

      <p style={{ color: 'white', fontSize: '1.2rem' }}>
        {text ? `Você digitou: ${text}` : 'Digite algo no campo acima'}
      </p>

      <button 
        onClick={() => {
          console.log('🎯 Teste clicado!');
          alert('FUNCIONA! A interface responde!');
        }}
        style={{ 
          padding: '15px 30px', 
          fontSize: '1.2rem', 
          backgroundColor: 'green', 
          color: 'white',
          border: 'none', 
          borderRadius: '8px',
          cursor: 'pointer'
        }}
      >
        TESTE CONSOLE
      </button>
    </div>
  );
}