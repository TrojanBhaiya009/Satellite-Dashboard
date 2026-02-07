import React from 'react'
import { Link } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { mockDatasets, mockAnalysis } from '../services/mockData'

function Home() {
  const { user } = useUser()

  const statsData = [
    {
      icon: '🛰️',
      label: 'Active Satellites',
      value: mockDatasets.length,
      desc: 'Global coverage',
      gradient: 'from-cyan-500 to-blue-600'
    },
    {
      icon: '📊',
      label: 'Spectral Analyses',
      value: '5',
      desc: 'Index types',
      gradient: 'from-purple-500 to-pink-600'
    },
    {
      icon: '🤖',
      label: 'AI Models',
      value: '3',
      desc: 'ML algorithms',
      gradient: 'from-green-500 to-emerald-600'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Hero Section */}
        <section className="pt-20 pb-16 text-center">
          <div className="mb-8">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                Satellite Intelligence
              </span>
            </h1>
            <p className="text-xl text-slate-400 mb-4">
              Analyze Earth from space with cutting-edge AI
            </p>
            <p className="text-slate-500 max-w-2xl mx-auto mb-8">
              Access high-resolution satellite imagery, run spectral analysis, and unlock insights from global Earth observation data
            </p>
            {!user && (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/auth" className="group inline-flex items-center justify-center px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold rounded-lg transition transform hover:scale-105 shadow-lg shadow-cyan-500/30">
                  <span className="mr-2">🚀</span>
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Quick Stats */}
        <section className="mb-20">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">📈 Dashboard Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {statsData.map((stat, idx) => (
              <div key={idx} className="group relative">
                <div className={`absolute inset-0 bg-gradient-to-r ${stat.gradient} rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition duration-300`}></div>
                <div className="relative bg-slate-800/50 border border-slate-700 rounded-2xl p-8 backdrop-blur-xl hover:border-slate-600 transition">
                  <div className="text-5xl mb-4">{stat.icon}</div>
                  <div className="text-3xl font-bold text-white mb-2">{stat.value}</div>
                  <div className="text-slate-400 font-medium mb-1">{stat.label}</div>
                  <div className="text-slate-500 text-sm">{stat.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Featured Projects */}
        <section className="mb-20">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-2xl font-bold text-white">🌍 Featured Projects</h2>
            <Link to="/datasets" className="text-cyan-400 hover:text-cyan-300 text-sm font-medium transition">
              View all →
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mockDatasets.slice(0, 4).map((dataset, idx) => (
              <Link key={idx} to="/datasets" className="group cursor-pointer">
                <div className="relative h-full bg-gradient-to-br from-slate-800/70 to-slate-700/40 border border-slate-700 rounded-2xl p-6 backdrop-blur-md hover:border-cyan-500/50 transition overflow-hidden">
                  {/* Background gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition"></div>
                  
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition mb-1">
                          {dataset.name}
                        </h3>
                        <p className="text-slate-400 text-sm">📍 {dataset.region}</p>
                      </div>
                      <span className="text-3xl">{idx === 0 ? '🌳' : idx === 1 ? '🔥' : idx === 2 ? '🌊' : '🏙️'}</span>
                    </div>
                    
                    <p className="text-slate-400 text-sm mb-4 line-clamp-2">
                      {dataset.region} analysis with {dataset.satellite}
                    </p>
                    
                    <div className="flex gap-4 mb-4">
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <span>☁️</span>
                        <span>{dataset.cloudCover}%</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <span>📏</span>
                        <span>{dataset.resolution}m</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <span>🛰️</span>
                        <span>{dataset.satellite}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <span className="inline-block px-3 py-1 bg-cyan-500/10 text-cyan-400 text-xs font-medium rounded-full border border-cyan-500/20">
                        {dataset.bands?.length || 0} Bands
                      </span>
                      <span className="inline-block px-3 py-1 bg-blue-500/10 text-blue-400 text-xs font-medium rounded-full border border-blue-500/20">
                        {dataset.extent?.split('x')[0] || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Call to Action */}
        <section className="mb-20">
          <div className="relative rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-blue-500/10 to-purple-500/20 blur-2xl"></div>
            <div className="relative bg-gradient-to-r from-slate-800/80 to-slate-700/60 border border-cyan-500/20 rounded-3xl p-12 backdrop-blur-xl">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-white mb-4">
                  Ready to Explore?
                </h2>
                <p className="text-slate-400 mb-8 max-w-2xl mx-auto">
                  Dive into our satellite dataset library or start analyzing spectral data right now
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link to="/datasets" className="group inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold rounded-xl transition transform hover:scale-105 shadow-lg shadow-cyan-500/30">
                    <span className="mr-2">🗂️</span>
                    Browse Datasets
                    <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                  <Link to="/analysis" className="group inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold rounded-xl transition transform hover:scale-105 shadow-lg shadow-purple-500/30">
                    <span className="mr-2">🔬</span>
                    Run Analysis
                    <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer spacing */}
        <div className="pb-10"></div>
      </div>
    </div>
  )
}

export default Home