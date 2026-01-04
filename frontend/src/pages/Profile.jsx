import React from 'react'
import { useUser } from '@clerk/clerk-react'

function Profile() {
  const { user } = useUser()

  const stats = [
    { icon: '🛰️', label: 'Datasets Viewed', value: '5' },
    { icon: '🔬', label: 'Analyses Run', value: '2' },
    { icon: '⭐', label: 'Experience Points', value: '850' }
  ]

  const recentActivity = [
    { action: 'Analyzed Amazon Rainforest dataset', time: '2 hours ago', icon: '📊' },
    { action: 'Viewed Nile Delta satellite imagery', time: '5 hours ago', icon: '👁️' },
    { action: 'Downloaded California Wildfire data', time: '1 day ago', icon: '📥' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-20 pb-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-3">
            👤 User Profile
          </h1>
          <p className="text-slate-400 text-lg">
            Manage your account and view your activity
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-slate-800/70 to-slate-700/50 border border-slate-700 rounded-2xl p-8 backdrop-blur-xl text-center sticky top-24">
              <div className="mb-6">
                {user?.imageUrl && (
                  <img
                    src={user.imageUrl}
                    alt="Profile"
                    className="w-32 h-32 rounded-full border-4 border-cyan-500/50 mx-auto shadow-lg shadow-cyan-500/20"
                  />
                )}
              </div>
              <h2 className="text-2xl font-bold text-white mb-1">
                {user?.firstName} {user?.lastName}
              </h2>
              <p className="text-cyan-400 text-sm font-medium mb-6">
                {user?.primaryEmailAddress?.emailAddress}
              </p>
              
              <div className="bg-slate-700/50 rounded-xl p-4 mb-6">
                <div className="text-xs text-slate-400 uppercase tracking-wide mb-1">Member Since</div>
                <div className="text-white font-semibold">
                  {new Date(user?.createdAt).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short' 
                  })}
                </div>
              </div>

              <a
                href="https://dashboard.clerk.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center px-4 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded-lg transition"
              >
                <span className="mr-2">⚙️</span>
                Edit Profile
              </a>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {stats.map((stat, idx) => (
                <div key={idx} className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition"></div>
                  <div className="relative bg-gradient-to-br from-slate-800/70 to-slate-700/50 border border-slate-700 rounded-xl p-6 backdrop-blur-xl text-center hover:border-cyan-500/30 transition">
                    <div className="text-3xl mb-3">{stat.icon}</div>
                    <div className="text-2xl font-bold text-cyan-300 mb-1">{stat.value}</div>
                    <div className="text-sm text-slate-400">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Account Information */}
            <div className="bg-gradient-to-br from-slate-800/70 to-slate-700/50 border border-slate-700 rounded-2xl p-8 backdrop-blur-xl">
              <h3 className="text-2xl font-bold text-cyan-400 mb-6 flex items-center">
                <span className="mr-3">📋</span> Account Information
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-slate-600">
                  <span className="text-slate-400">First Name</span>
                  <span className="font-semibold text-white">{user?.firstName}</span>
                </div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-600">
                  <span className="text-slate-400">Last Name</span>
                  <span className="font-semibold text-white">{user?.lastName}</span>
                </div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-600">
                  <span className="text-slate-400">Email Address</span>
                  <span className="font-semibold text-white text-sm">{user?.primaryEmailAddress?.emailAddress}</span>
                </div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-600">
                  <span className="text-slate-400">Account Created</span>
                  <span className="font-semibold text-white">
                    {new Date(user?.createdAt).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Last Updated</span>
                  <span className="font-semibold text-white">
                    {new Date(user?.updatedAt).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-gradient-to-br from-slate-800/70 to-slate-700/50 border border-slate-700 rounded-2xl p-8 backdrop-blur-xl">
              <h3 className="text-2xl font-bold text-cyan-400 mb-6 flex items-center">
                <span className="mr-3">⚡</span> Recent Activity
              </h3>
              
              <div className="space-y-4">
                {recentActivity.map((activity, idx) => (
                  <div key={idx} className="flex items-center gap-4 pb-4 border-b border-slate-700 last:border-0 last:pb-0">
                    <div className="text-2xl">{activity.icon}</div>
                    <div className="flex-1">
                      <p className="text-white font-medium">{activity.action}</p>
                      <p className="text-slate-400 text-sm">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
