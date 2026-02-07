import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useUser, useAuth } from '@clerk/clerk-react'
import { useAuthStore } from './store'
import Auth from './pages/Auth'
import Home from './pages/Home'
import Datasets from './pages/Datasets'
import Analysis from './pages/Analysis'
import DataFusion from './pages/DataFusion'
import Globe from './pages/Globe'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import './styles/Globe.css'
import Navigation from './components/Navigation'
import { Toaster } from 'react-hot-toast'

function App() {
  const { user, isLoaded, isSignedIn } = useUser()
  const { getToken } = useAuth()
  const setUser = useAuthStore(state => state.setUser)
  const setToken = useAuthStore(state => state.setToken)

  useEffect(() => {
    if (user && isSignedIn) {
      setUser({
        id: user.id,
        email: user.primaryEmailAddress?.emailAddress,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        image: user.imageUrl
      })
      
      getToken().then(token => {
        if (token) setToken(token)
      }).catch(err => console.log('Token error:', err))
    }
  }, [user, isSignedIn, getToken, setUser, setToken])

  if (!isLoaded) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '4px solid rgba(6, 182, 212, 0.2)',
            borderTop: '4px solid rgb(6, 182, 212)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <p style={{ color: 'rgb(6, 182, 212)', fontWeight: '600', fontSize: '16px' }}>Loading Dashboard...</p>
          <style>{`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    )
  }

  return (
    <Router>
      <Toaster position="top-right" />
      {isSignedIn && <Navigation />}
      <Routes>
        <Route path="/auth" element={!isSignedIn ? <Auth /> : <Navigate to="/" />} />
        <Route path="/" element={isSignedIn ? <Home /> : <Navigate to="/auth" />} />
        <Route path="/datasets" element={isSignedIn ? <Datasets /> : <Navigate to="/auth" />} />
        <Route path="/analysis" element={isSignedIn ? <Analysis /> : <Navigate to="/auth" />} />
        <Route path="/fusion" element={isSignedIn ? <DataFusion /> : <Navigate to="/auth" />} />
        <Route path="/globe" element={isSignedIn ? <Globe /> : <Navigate to="/auth" />} />
        <Route path="/profile" element={isSignedIn ? <Profile /> : <Navigate to="/auth" />} />
        <Route path="/settings" element={isSignedIn ? <Settings /> : <Navigate to="/auth" />} />
        <Route path="*" element={<Navigate to={isSignedIn ? "/" : "/auth"} />} />
      </Routes>
    </Router>
  )
}

export default App
