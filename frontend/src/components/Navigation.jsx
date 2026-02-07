import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useUser, useClerk } from '@clerk/clerk-react'

function Navigation() {
  const { user } = useUser()
  const { signOut } = useClerk()
  const navigate = useNavigate()
  const location = useLocation()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const handleLogout = async () => {
    await signOut()
    navigate('/auth')
  }

  const isActive = (path) => location.pathname === path

  if (!user) return null

  return (
    <nav className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-cyan-500/30 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center group-hover:shadow-lg group-hover:shadow-cyan-500/50 transition">
              <span className="text-white font-bold text-lg">🛰️</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              SatelliteAI
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex gap-1">
            <Link
              to="/"
              className={`px-4 py-2 rounded-lg font-medium transition ${
                isActive('/') 
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              Home
            </Link>
            <Link
              to="/datasets"
              className={`px-4 py-2 rounded-lg font-medium transition ${
                isActive('/datasets') 
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              Datasets
            </Link>
            <Link
              to="/analysis"
              className={`px-4 py-2 rounded-lg font-medium transition ${
                isActive('/analysis') 
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              Analysis
            </Link>
            <Link
              to="/fusion"
              className={`px-4 py-2 rounded-lg font-medium transition ${
                isActive('/fusion') 
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              Data Fusion
            </Link>
            <Link
              to="/mission-control"
              className={`px-4 py-2 rounded-lg font-medium transition ${
                isActive('/mission-control') 
                  ? 'bg-red-500/20 text-red-400 border border-red-500/50' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              🚀 Mission Control
            </Link>
            <Link
              to="/globe"
              className={`px-4 py-2 rounded-lg font-medium transition ${
                isActive('/globe') 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              🌐 3D Globe
            </Link>
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-3 px-4 py-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 border border-slate-600 transition group"
            >
              <img
                src={user?.imageUrl}
                alt={user?.firstName}
                className="w-8 h-8 rounded-full border border-cyan-500/50 group-hover:border-cyan-400 transition"
              />
              <span className="text-white font-medium hidden sm:block">
                {user?.firstName}
              </span>
              <svg className={`w-4 h-4 text-slate-400 transition ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden z-10">
                <Link
                  to="/profile"
                  className="block px-4 py-3 text-slate-300 hover:bg-slate-700 hover:text-white transition border-b border-slate-700"
                  onClick={() => setDropdownOpen(false)}
                >
                  👤 My Profile
                </Link>
                <Link
                  to="/settings"
                  className="block px-4 py-3 text-slate-300 hover:bg-slate-700 hover:text-white transition border-b border-slate-700"
                  onClick={() => setDropdownOpen(false)}
                >
                  ⚙️ Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-3 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition font-medium"
                >
                  🚪 Logout
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden pb-4 flex gap-2">
          <Link
            to="/"
            className={`flex-1 px-3 py-2 rounded text-sm font-medium text-center transition ${
              isActive('/') 
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' 
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Home
          </Link>
          <Link
            to="/datasets"
            className={`flex-1 px-3 py-2 rounded text-sm font-medium text-center transition ${
              isActive('/datasets') 
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' 
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Datasets
          </Link>
          <Link
            to="/analysis"
            className={`flex-1 px-3 py-2 rounded text-sm font-medium text-center transition ${
              isActive('/analysis') 
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' 
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Analysis
          </Link>
          <Link
            to="/mission-control"
            className={`flex-1 px-3 py-2 rounded text-sm font-medium text-center transition ${
              isActive('/mission-control') 
                ? 'bg-red-500/20 text-red-400 border border-red-500/50' 
                : 'text-slate-300 hover:text-white'
            }`}
          >
            🚀 MC
          </Link>
        </div>
      </div>
    </nav>
  )
}

export default Navigation
