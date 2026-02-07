import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './App.css'
import { ClerkProvider } from '@clerk/clerk-react'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  console.error(
    'Missing VITE_CLERK_PUBLISHABLE_KEY. Add it to your .env file or Vercel environment variables.'
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {PUBLISHABLE_KEY ? (
      <ClerkProvider 
        publishableKey={PUBLISHABLE_KEY}
        afterSignOutUrl="/"
      >
        <App />
      </ClerkProvider>
    ) : (
      <div style={{
        minHeight: '100vh',
        background: '#0f172a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#f87171',
        fontFamily: "'SF Pro Display', system-ui, sans-serif",
        padding: '2rem',
        textAlign: 'center'
      }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>⚠️ Configuration Required</h1>
          <p style={{ color: '#94a3b8' }}>
            Set <code style={{ color: '#06b6d4' }}>VITE_CLERK_PUBLISHABLE_KEY</code> in your environment variables.
          </p>
        </div>
      </div>
    )}
  </React.StrictMode>,
)
