import { useState } from 'react';
import './App.css';

export function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="container">
      <div className="logo-badge">Milestone 0: Project Initialized</div>
      <h1>VidaLoom Video Composer</h1>
      <p className="subtitle">
        Local-first browser video composition with Remotion & Mediabunny
      </p>

      <div className="status-grid">
        <div className="status-card">
          <div className="status-label">Framework</div>
          <div className="status-value">React 19 + Vite + TS</div>
        </div>
        <div className="status-card">
          <div className="status-label">Renderer Engine</div>
          <div className="status-value">Remotion 4.0.544</div>
        </div>
        <div className="status-card">
          <div className="status-label">Media & Audio</div>
          <div className="status-value">Mediabunny + Web Audio</div>
        </div>
        <div className="status-card">
          <div className="status-label">State & Validation</div>
          <div className="status-value">Zustand + Zod</div>
        </div>
      </div>

      <div className="card">
        <button onClick={() => setCount((c) => c + 1)}>
          Interactive Check: count is {count}
        </button>
      </div>
    </div>
  );
}

export default App;
