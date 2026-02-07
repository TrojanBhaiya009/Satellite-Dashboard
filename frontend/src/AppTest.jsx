import React, { useState } from 'react'
import Home from './pages/Home'
import Datasets from './pages/Datasets'
import Analysis from './pages/Analysis'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import { Toaster } from 'react-hot-toast'

function AppTest() {
  const [currentPage, setCurrentPage] = useState('home')

  const mockUser = {
    id: 'test-user-123',
    firstName: 'Alex',
    lastName: 'Johnson',
    imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
    primaryEmailAddress: { emailAddress: 'alex@satelliteai.com' },
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date()
  }

  const renderPage = () => {
    switch(currentPage) {
      case 'home': return <Home />
      case 'datasets': return <Datasets />
      case 'analysis': return <Analysis />
      case 'profile': return <Profile />
      case 'settings': return <Settings />
      default: return <Home />
    }
  }

  return (
    <>
      <Toaster position="top-right" />
      
      {/* Navigation */}
      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'linear-gradient(to right, rgb(15, 23, 42), rgb(30, 41, 59), rgb(15, 23, 42))',
        borderBottom: '1px solid rgba(148, 163, 184, 0.3)',
        backdropFilter: 'blur(12px)'
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: '64px'
        }}>
          {/* Logo */}
          <button
            onClick={() => setCurrentPage('home')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'white',
              fontSize: '20px',
              fontWeight: 'bold'
            }}
          >
            <span style={{ fontSize: '28px' }}>🛰️</span>
            <span style={{ background: 'linear-gradient(to right, rgb(34, 197, 94), rgb(6, 182, 212))', backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              SatelliteAI
            </span>
          </button>

          {/* Nav Links */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {[
              { id: 'home', label: 'Home', icon: '🏠' },
              { id: 'datasets', label: 'Datasets', icon: '📡' },
              { id: 'analysis', label: 'Analysis', icon: '🔬' },
              { id: 'profile', label: 'Profile', icon: '👤' },
              { id: 'settings', label: 'Settings', icon: '⚙️' }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: currentPage === item.id ? 'rgba(34, 197, 94, 0.2)' : 'transparent',
                  color: currentPage === item.id ? 'rgb(34, 197, 94)' : 'rgb(148, 163, 184)',
                  cursor: 'pointer',
                  fontWeight: currentPage === item.id ? '600' : '500',
                  transition: 'all 0.3s ease',
                  fontSize: '14px'
                }}
              >
                {item.icon} {item.label}
              </button>
            ))}
          </div>

          {/* User Menu */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '8px 16px',
            background: 'rgba(30, 41, 59, 0.8)',
            border: '1px solid rgba(148, 163, 184, 0.3)',
            borderRadius: '8px'
          }}>
            <img 
              src={mockUser.imageUrl} 
              alt="User"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border: '2px solid rgba(34, 197, 94, 0.5)'
              }}
            />
            <span style={{ color: 'white', fontSize: '14px', fontWeight: '600' }}>
              {mockUser.firstName}
            </span>
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <div style={{ minHeight: 'calc(100vh - 64px)' }}>
        {renderPage()}
      </div>
    </>
  )
}

export default AppTest
