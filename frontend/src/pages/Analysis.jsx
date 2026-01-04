import React, { useState } from 'react'
import { mockDatasets, mockAnalysis } from '../services/mockData'
import toast from 'react-hot-toast'

function Analysis() {
  const [selectedDataset, setSelectedDataset] = useState(mockDatasets[0])
  const [selectedAnalysis, setSelectedAnalysis] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const runAnalysis = () => {
    setIsLoading(true)
    setTimeout(() => {
      const analysis = mockAnalysis[0] || {
        analysisType: 'Vegetation Health Assessment',
        timestamp: new Date().toLocaleString(),
        results: {
          ndvi: [0.72, 0.71, 0.69, 0.65, 0.58, 0.52, 0.48, 0.45, 0.42, 0.38],
          ndbi: [0.12, 0.14, 0.16, 0.22, 0.28, 0.35, 0.42, 0.48, 0.55, 0.62],
          ndmi: [0.68, 0.67, 0.65, 0.62, 0.58, 0.52, 0.45, 0.38, 0.32, 0.25],
          ndwi: [0.35, 0.33, 0.30, 0.25, 0.18, 0.12, 0.08, 0.05, 0.02, 0.0],
          evi: [1.85, 1.82, 1.78, 1.70, 1.58, 1.42, 1.28, 1.15, 1.02, 0.88]
        },
        statistics: {
          ndviMean: 0.60,
          ndviMin: 0.38,
          ndviMax: 0.72,
          ndbiMean: 0.33,
          ndmiMean: 0.54,
          vegetationCover: '78.5%',
          deforestationRisk: 'HIGH',
          carbonContent: '245.3 Mg/ha'
        }
      }
      setSelectedAnalysis(analysis)
      setIsLoading(false)
      toast.success('✅ Analysis Complete!')
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-3">
            🔬 Spectral Analysis
          </h1>
          <p className="text-slate-400 text-lg">
            Analyze satellite imagery with advanced spectral indices and ML algorithms
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Dataset Selection */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <h2 className="text-xl font-bold text-cyan-400 mb-4">📍 Select Region</h2>
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {mockDatasets.map((dataset, idx) => (
                  <button
                    key={dataset._id}
                    onClick={() => setSelectedDataset(dataset)}
                    className={`w-full text-left p-4 rounded-xl border transition transform hover:scale-105 ${
                      selectedDataset._id === dataset._id
                        ? 'bg-gradient-to-br from-cyan-500/30 to-blue-500/20 border-cyan-500/50 shadow-lg shadow-cyan-500/20'
                        : 'bg-slate-800/50 border-slate-700 hover:border-slate-600 hover:bg-slate-700/50'
                    }`}
                  >
                    <div className="text-2xl mb-2">{idx === 0 ? '🌳' : idx === 1 ? '🔥' : idx === 2 ? '🌊' : idx === 3 ? '❄️' : '🏙️'}</div>
                    <div className="font-bold text-white text-sm mb-1">{dataset.name}</div>
                    <div className="text-xs text-slate-400">{dataset.region}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content - Analysis */}
          <div className="lg:col-span-3">
            {!selectedAnalysis ? (
              <div className="relative rounded-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-blue-500/10 to-purple-500/20 blur-2xl"></div>
                <div className="relative bg-gradient-to-br from-slate-800/80 to-slate-700/60 border border-cyan-500/20 rounded-2xl p-12 backdrop-blur-xl text-center">
                  <div className="mb-6">
                    <h2 className="text-3xl font-bold text-white mb-2">Ready to analyze?</h2>
                    <p className="text-slate-400 mb-4">Running spectral analysis on:</p>
                    <div className="flex items-center justify-center gap-3 mb-6">
                      <div className="text-3xl">📡</div>
                      <div>
                        <p className="font-bold text-cyan-300 text-lg">{selectedDataset.name}</p>
                        <p className="text-slate-400 text-sm">{selectedDataset.region}</p>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={runAnalysis}
                    disabled={isLoading}
                    className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:from-slate-600 disabled:to-slate-700 text-white font-bold rounded-xl transition transform hover:scale-105 disabled:scale-100 shadow-lg shadow-cyan-500/30"
                  >
                    {isLoading ? (
                      <>
                        <svg className="w-5 h-5 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <span className="mr-2">🚀</span>
                        Run Analysis
                      </>
                    )}
                  </button>

                  <div className="mt-8 grid grid-cols-3 gap-4 text-left">
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <div className="text-xs text-slate-400 uppercase tracking-wide mb-2">Satellite</div>
                      <div className="font-semibold text-white">{selectedDataset.satellite}</div>
                    </div>
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <div className="text-xs text-slate-400 uppercase tracking-wide mb-2">Resolution</div>
                      <div className="font-semibold text-white">{selectedDataset.resolution}m</div>
                    </div>
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <div className="text-xs text-slate-400 uppercase tracking-wide mb-2">Cloud Cover</div>
                      <div className="font-semibold text-white">{selectedDataset.cloudCover}%</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Header with reset button */}
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-3xl font-bold text-cyan-300 mb-2">✅ {selectedAnalysis.analysisType}</h2>
                    <p className="text-slate-400 text-sm">Completed at {selectedAnalysis.timestamp}</p>
                  </div>
                  <button
                    onClick={() => setSelectedAnalysis(null)}
                    className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl transition transform hover:scale-105"
                  >
                    ← New Analysis
                  </button>
                </div>

                {/* Statistics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {Object.entries(selectedAnalysis.statistics).slice(0, 6).map(([key, value]) => (
                    <div key={key} className="bg-gradient-to-br from-slate-800/70 to-slate-700/50 border border-slate-700 rounded-xl p-4 backdrop-blur-xl">
                      <div className="text-xs text-slate-400 uppercase tracking-wide mb-2 font-medium">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </div>
                      <div className="font-bold text-cyan-300 text-lg break-words">{value}</div>
                    </div>
                  ))}
                </div>

                {/* Spectral Indices Visualization */}
                <div className="bg-gradient-to-br from-slate-800/70 to-slate-700/50 border border-slate-700 rounded-2xl p-8 backdrop-blur-xl">
                  <h3 className="text-2xl font-bold text-cyan-400 mb-6 flex items-center">
                    <span className="mr-3">📊</span> Spectral Indices
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {[
                      { label: 'NDVI', color: 'from-green-500', data: selectedAnalysis.results.ndvi },
                      { label: 'NDBI', color: 'from-red-500', data: selectedAnalysis.results.ndbi },
                      { label: 'NDMI', color: 'from-blue-500', data: selectedAnalysis.results.ndmi },
                      { label: 'NDWI', color: 'from-cyan-500', data: selectedAnalysis.results.ndwi },
                      { label: 'EVI', color: 'from-purple-500', data: selectedAnalysis.results.evi }
                    ].map((index, idx) => (
                      <div key={idx} className="bg-slate-700/50 rounded-xl p-4 border border-slate-600">
                        <div className="text-sm font-bold text-white mb-3">{index.label}</div>
                        <div className="space-y-2">
                          {index.data.slice(0, 5).map((val, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <div className={`h-2 bg-gradient-to-r ${index.color} to-transparent rounded-full`} style={{width: `${val * 100}%`}}></div>
                              <span className="text-xs text-slate-400">{val.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Additional Statistics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Object.entries(selectedAnalysis.statistics).slice(6).map(([key, value]) => (
                    <div key={key} className="bg-gradient-to-br from-slate-800/70 to-slate-700/50 border border-slate-700 rounded-xl p-6 backdrop-blur-xl">
                      <div className="text-sm text-slate-400 uppercase tracking-wide mb-2 font-medium">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </div>
                      <div className="font-bold text-cyan-300 text-xl">{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Analysis
