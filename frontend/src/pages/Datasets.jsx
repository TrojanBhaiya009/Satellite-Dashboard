import React, { useEffect } from 'react'
import { useDatasetStore } from '../store'
import { mockDatasets } from '../services/mockData'
import toast from 'react-hot-toast'

function Datasets() {
  const datasets = useDatasetStore(state => state.datasets)
  const setDatasets = useDatasetStore(state => state.setDatasets)
  const [selectedId, setSelectedId] = React.useState(null)

  useEffect(() => {
    setDatasets(mockDatasets)
    toast.success('📡 Datasets loaded!')
  }, [setDatasets])

  useEffect(() => {
    if (datasets.length > 0 && !selectedId) {
      setSelectedId(datasets[0]._id)
    }
  }, [datasets, selectedId])

  const selected = datasets.find(d => d._id === selectedId)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-3">
            📡 Satellite Datasets
          </h1>
          <p className="text-slate-400 text-lg">
            Explore high-resolution satellite imagery from Sentinel-2 and Landsat missions
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Dataset List */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-3">
              <h2 className="text-xl font-bold text-cyan-400 mb-4">🗂️ Available Datasets</h2>
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-4">
                {datasets.map((dataset, idx) => (
                  <button
                    key={dataset._id}
                    onClick={() => setSelectedId(dataset._id)}
                    className={`w-full text-left p-4 rounded-xl border transition transform hover:scale-105 ${
                      selectedId === dataset._id
                        ? 'bg-gradient-to-br from-cyan-500/30 to-blue-500/20 border-cyan-500/50 shadow-lg shadow-cyan-500/20'
                        : 'bg-slate-800/50 border-slate-700 hover:border-slate-600 hover:bg-slate-700/50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="text-2xl">{idx === 0 ? '🌳' : idx === 1 ? '🔥' : idx === 2 ? '🌊' : idx === 3 ? '❄️' : '🏙️'}</div>
                      <div className={`text-xs px-2 py-1 rounded-full font-medium ${
                        selectedId === dataset._id 
                          ? 'bg-cyan-500/30 text-cyan-300' 
                          : 'bg-slate-700/50 text-slate-400'
                      }`}>
                        {dataset.satellite}
                      </div>
                    </div>
                    <div className="font-bold text-white text-sm mb-1">{dataset.name}</div>
                    <div className="text-xs text-slate-400 mb-2">{dataset.region}</div>
                    <div className="flex gap-2 text-xs text-slate-500">
                      <span>☁️ {dataset.cloudCover}%</span>
                      <span>📏 {dataset.resolution}m</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Dataset Details */}
          <div className="lg:col-span-2">
            {selected ? (
              <div className="space-y-6">
                {/* Main Info Card */}
                <div className="bg-gradient-to-br from-slate-800/70 to-slate-700/50 border border-slate-700 rounded-2xl p-8 backdrop-blur-xl">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className="text-3xl font-bold text-cyan-300 mb-2">{selected.name}</h2>
                      <p className="text-slate-400">Satellite imagery of {selected.region}</p>
                    </div>
                    <div className="text-5xl">🛰️</div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-4">
                      <div className="text-xs text-slate-400 uppercase tracking-wide mb-2">Satellite</div>
                      <div className="font-bold text-white">{selected.satellite}</div>
                    </div>
                    <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                      <div className="text-xs text-slate-400 uppercase tracking-wide mb-2">Region</div>
                      <div className="font-bold text-white">{selected.region}</div>
                    </div>
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                      <div className="text-xs text-slate-400 uppercase tracking-wide mb-2">Cloud Cover</div>
                      <div className="font-bold text-white">{selected.cloudCover}%</div>
                    </div>
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                      <div className="text-xs text-slate-400 uppercase tracking-wide mb-2">Resolution</div>
                      <div className="font-bold text-white">{selected.resolution}m</div>
                    </div>
                  </div>
                </div>

                {/* Bands Section */}
                <div className="bg-gradient-to-br from-slate-800/70 to-slate-700/50 border border-slate-700 rounded-2xl p-8 backdrop-blur-xl">
                  <h3 className="text-2xl font-bold text-cyan-400 mb-6 flex items-center">
                    <span className="mr-3">📊</span> Spectral Bands
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {Object.entries(selected.bands).map(([bandId, band]) => (
                      <div key={bandId} className="bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg p-4 transition">
                        <div className="font-mono text-cyan-300 text-sm font-bold mb-1">{bandId}</div>
                        <div className="text-xs text-slate-400">{band.name}</div>
                        {band.wavelength && (
                          <div className="text-xs text-slate-500 mt-2">λ: {band.wavelength}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Additional Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-slate-800/70 to-slate-700/50 border border-slate-700 rounded-2xl p-6 backdrop-blur-xl">
                    <h4 className="font-bold text-white mb-4">📅 Acquisition Date</h4>
                    <p className="text-cyan-400 font-semibold">
                      {new Date(selected.acquisitionDate).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-slate-800/70 to-slate-700/50 border border-slate-700 rounded-2xl p-6 backdrop-blur-xl">
                    <h4 className="font-bold text-white mb-4">📐 Extent</h4>
                    <p className="text-cyan-400 font-semibold">{selected.extent}</p>
                  </div>
                </div>

                {/* Download Links */}
                <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-2xl p-6 backdrop-blur-xl">
                  <h4 className="font-bold text-white mb-4">📥 Download</h4>
                  <div className="flex flex-wrap gap-3">
                    {selected.sources?.map((source, idx) => (
                      <a
                        key={idx}
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded-lg transition transform hover:scale-105"
                      >
                        <span className="mr-2">🔗</span>
                        {source.name}
                        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-12 backdrop-blur-xl text-center">
                <p className="text-slate-400">Select a dataset to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Datasets