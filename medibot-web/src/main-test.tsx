import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Simple test to check if React renders at all
function TestApp() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>🚀 React is Working!</h1>
      <p>If you see this, React is rendering correctly.</p>
      <p>Server: Bun + Vite</p>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TestApp />
  </StrictMode>,
)
