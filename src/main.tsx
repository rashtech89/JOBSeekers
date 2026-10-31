import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { LanguageProvider } from './i18n/LanguageContext'
import { SiteSettingsProvider } from './context/SiteSettings'
import { ThemeProvider } from './context/Theme'
import { AuthProvider } from './context/Auth'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <ThemeProvider><LanguageProvider><AuthProvider><SiteSettingsProvider><App /></SiteSettingsProvider></AuthProvider></LanguageProvider></ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
