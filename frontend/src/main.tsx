import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import ErrorBoundary from './log/ErrorBoundary'
import { enhancedLogService } from './features/log/services/enhancedLogService'

// Initialize enhanced logging
enhancedLogService.logAction('app_initialization', 'Main', { timestamp: new Date().toISOString() });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)

