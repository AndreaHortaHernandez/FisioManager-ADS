import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { useStore } from './store/useStore'
import { setAuthToken } from './services/api'

// Restaurar token al cargar la app si hay sesión persistida
const { token, isAuthenticated, loadData } = useStore.getState()
if (isAuthenticated && token) {
  setAuthToken(token)
  loadData().catch(console.error)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
