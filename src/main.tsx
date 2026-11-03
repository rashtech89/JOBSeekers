import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { LanguageProvider } from './i18n/LanguageContext'
import { SiteSettingsProvider } from './context/SiteSettings'
import { ThemeProvider } from './context/Theme'
import { AuthProvider } from './context/Auth'
import { ContentProvider } from './context/Content'
import ThemeEngine from './context/ThemeEngine'
import { CountryProvider } from './context/Country'
import { JobsProvider } from './context/Jobs'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <ThemeProvider><ContentProvider><LanguageProvider><AuthProvider><SiteSettingsProvider><ThemeEngine /><CountryProvider><JobsProvider><App /></JobsProvider></CountryProvider></SiteSettingsProvider></AuthProvider></LanguageProvider></ContentProvider></ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
