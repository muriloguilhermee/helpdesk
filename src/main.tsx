import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthContext.tsx'
import { TicketsProvider } from './contexts/TicketsContext.tsx'
import { FinancialProvider } from './contexts/FinancialContext.tsx'
import { ThemeProvider } from './contexts/ThemeContext.tsx'
import { NotificationsProvider } from './contexts/NotificationsContext.tsx'
import { LanguageProvider } from './contexts/LanguageContext.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <LanguageProvider>
        <NotificationsProvider>
          <AuthProvider>
            <TicketsProvider>
              <FinancialProvider>
                <App />
              </FinancialProvider>
            </TicketsProvider>
          </AuthProvider>
        </NotificationsProvider>
      </LanguageProvider>
    </ThemeProvider>
  </React.StrictMode>,
)


