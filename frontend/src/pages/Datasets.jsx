import React, { useEffect, useState } from 'react'
import { useDatasetStore } from '../store'
import { mockDatasets } from '../services/mockData'
import { 
  fetchSentinel2Data, 
  fetchLandsatData, 
  formatSceneData,
  STAC_ENDPOINTS,
  searchSTACItems
} from '../services/satelliteApi'

function Datasets() {
  const datasets = useDatasetStore(state => state.datasets)
  const setDatasets = useDatasetStore(state => state.setDatasets)
  const [selectedId, setSelectedId] = useState(null)
  const [realTimeScenes, setRealTimeScenes] = useState([])
  const [isLoadingScenes, setIsLoadingScenes] = useState(false)
  const [downloadStatus, setDownloadStatus] = useState({})

  useEffect(() => {
    setDatasets(mockDatasets)
  }, [setDatasets])

  useEffect(() => {
    if (datasets.length > 0 && !selectedId) {
      setSelectedId(datasets[0]._id)
    }
  }, [datasets, selectedId])

  const selected = datasets.find(d => d._id === selectedId)

  // Fetch real-time satellite scenes when a dataset is selected
  useEffect(() => {
    const fetchScenes = async () => {
      if (!selected) return
      
      setIsLoadingScenes(true)
      setRealTimeScenes([])
      
      try {
        const today = new Date()
        const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
        const startDate = lastMonth.toISOString().split('T')[0]
        const endDate = today.toISOString().split('T')[0]
        
        // Extract bbox from coordinates
        const coords = selected.coordinates?.coordinates?.[0] || []
        let bbox = null
        if (coords.length > 0) {
          bbox = [
            Math.min(...coords.map(c => c[0])),
            Math.min(...coords.map(c => c[1])),
            Math.max(...coords.map(c => c[0])),
            Math.max(...coords.map(c => c[1]))
          ]
        }
        
        let scenes = []
        if (selected.satellite === 'Sentinel-2' && bbox) {
          scenes = await fetchSentinel2Data(bbox, startDate, endDate, 20)
        } else if (selected.satellite === 'Landsat-9' && bbox) {
          scenes = await fetchLandsatData(bbox, startDate, endDate, 20)
        } else if (bbox) {
          scenes = await searchSTACItems(
            STAC_ENDPOINTS.earthSearch,
            'sentinel-2-l2a',
            bbox,
            `${startDate}/${endDate}`,
            10
          )
        }
        
        const formatted = scenes.slice(0, 8).map(formatSceneData).filter(Boolean)
        setRealTimeScenes(formatted)
      } catch (error) {
        console.error('Failed to fetch scenes:', error)
      }
      
      setIsLoadingScenes(false)
    }
    
    fetchScenes()
  }, [selected])

  const handleDownload = (source, sourceIdx) => {
    setDownloadStatus(prev => ({ ...prev, [sourceIdx]: 'loading' }))
    
    // Open the URL in a new tab
    window.open(source.url, '_blank', 'noopener,noreferrer')
    
    // Show success after a delay
    setTimeout(() => {
      setDownloadStatus(prev => ({ ...prev, [sourceIdx]: 'success' }))
      setTimeout(() => {
        setDownloadStatus(prev => ({ ...prev, [sourceIdx]: null }))
      }, 2000)
    }, 500)
  }

  const handleSceneDownload = (scene) => {
    if (scene.downloadUrl) {
      window.open(scene.downloadUrl, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-3">
                📡 Satellite Datasets
              </h1>
              <p className="text-slate-400 text-lg">
                Explore satellite imagery with real-time scene availability
              </p>
            </div>
            
            {/* Live Indicator */}
            <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-sm font-semibold text-green-400">LIVE CATALOG</span>
            </div>
          </div>
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
                    className={`w-full text-left p-4 rounded-xl border transition transform hover:scale-102 ${
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
                    <div className="flex gap-3 text-xs text-slate-500">
                      <span>☁️ {dataset.cloudCover}%</span>
                      <span>📏 {dataset.resolution}</span>
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
                      <div className="font-bold text-white">{selected.resolution}</div>
                    </div>
                  </div>
                </div>

                {/* Real-Time Scenes */}
                <div className="bg-gradient-to-br from-slate-800/70 to-slate-700/50 border border-slate-700 rounded-2xl p-6 backdrop-blur-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-green-400 flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      Live Satellite Scenes
                    </h3>
                    {isLoadingScenes && (
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <div className="w-3 h-3 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                        <span>Fetching from STAC API...</span>
                      </div>
                    )}
                  </div>
                  
                  {realTimeScenes.length > 0 ? (
                    <div className="space-y-3 max-h-[300px] overflow-y-auto">
                      {realTimeScenes.map((scene, idx) => (
                        <div key={scene.id || idx} className="bg-slate-900/50 rounded-lg p-4 flex items-center justify-between hover:bg-slate-800/50 transition">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-white">{scene.satellite || selected.satellite}</p>
                              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">LIVE</span>
                            </div>
                            <p className="text-xs text-slate-400 mt-1">
                              📅 {scene.datetime ? new Date(scene.datetime).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric' 
                              }) : 'N/A'}
                            </p>
                          </div>
                          <div className="text-center px-4">
                            <p className="text-xs text-slate-400">Cloud</p>
                            <p className={`text-sm font-bold ${(scene.cloudCover || 0) < 20 ? 'text-green-400' : (scene.cloudCover || 0) < 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                              {scene.cloudCover?.toFixed(1) || 0}%
                            </p>
                          </div>
                          <button
                            onClick={() => handleSceneDownload(scene)}
                            className="px-4 py-2 bg-cyan-500/20 text-cyan-400 text-xs font-semibold rounded-lg hover:bg-cyan-500/30 transition"
                          >
                            View Data →
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : !isLoadingScenes ? (
                    <div className="text-center py-8 text-slate-500">
                      <p>No recent scenes available for this region</p>
                      <p className="text-xs mt-1">Try checking the official data sources below</p>
                    </div>
                  ) : null}
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
                        {band.frequency && (
                          <div className="text-xs text-slate-500 mt-2">{band.frequency}</div>
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
                    <p className="text-cyan-400 font-semibold">{selected.extent || 'Variable coverage'}</p>
                  </div>
                </div>

                {/* Metadata Card */}
                <div className="bg-gradient-to-br from-slate-800/70 to-slate-700/50 border border-slate-700 rounded-2xl p-6 backdrop-blur-xl">
                  <h4 className="font-bold text-white mb-4">📋 Metadata</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-400">Processing Level</p>
                      <p className="text-white font-semibold">{selected.level}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">File Format</p>
                      <p className="text-white font-semibold">{selected.metadata?.fileFormat}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Product ID</p>
                      <p className="text-white font-mono text-xs">{selected.metadata?.productId}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Data Source</p>
                      <p className="text-white font-semibold">{selected.metadata?.source}</p>
                    </div>
                  </div>
                </div>

                {/* Download Links */}
                <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-2xl p-6 backdrop-blur-xl">
                  <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                    📥 Download Sources
                    <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded">Official</span>
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    {selected.sources?.map((source, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleDownload(source, idx)}
                        disabled={downloadStatus[idx] === 'loading'}
                        className="inline-flex items-center px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded-lg transition transform hover:scale-105 disabled:opacity-50"
                      >
                        {downloadStatus[idx] === 'loading' ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        ) : downloadStatus[idx] === 'success' ? (
                          <span className="mr-2">✅</span>
                        ) : (
                          <span className="mr-2">🔗</span>
                        )}
                        {source.name}
                        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 mt-4">
                    💡 These links open official satellite data portals where you can download the full datasets
                  </p>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-4">
                  <a
                    href={selected.metadata?.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl text-center hover:from-cyan-600 hover:to-blue-700 transition"
                  >
                    🚀 Open in Official Portal
                  </a>
                  <button
                    onClick={() => window.open(`https://earthexplorer.usgs.gov/`, '_blank')}
                    className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition"
                  >
                    🌍 USGS Explorer
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-12 backdrop-blur-xl text-center">
                <div className="text-6xl mb-4">📡</div>
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
