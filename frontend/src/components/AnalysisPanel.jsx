import React, { useState } from 'react'
import { useAnalysisStore } from '../store'
import { mockAnalysis } from '../services/mockData'
import toast from 'react-hot-toast'

function AnalysisPanel({ dataset }) {
  const [selectedAnalysis, setSelectedAnalysis] = useState(null)
  const [showChart, setShowChart] = useState(false)

  // Get analysis for this dataset
  const datasetAnalyses = mockAnalysis.filter(a => a.datasetId === dataset?._id)

  const runAnalysis = () => {
    if (!dataset) {
      toast.error('Select a dataset first')
      return
    }

    // Find matching analysis or create mock one
    const analysis = datasetAnalyses[0] || mockAnalysis[0]
    setSelectedAnalysis(analysis)
    setShowChart(true)
    toast.success('✅ Analysis complete!')
  }

  return (
    <div className="p-4 space-y-4 overflow-y-auto max-h-[600px]">
      {!selectedAnalysis ? (
        <>
          <h3 className="font-bold text-cyan-400">🔬 Run Spectral Analysis</h3>
          <p className="text-xs text-slate-400">
            Analyze spectral bands to detect vegetation, urban areas, water, and burn severity
          </p>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">Analysis Type</label>
              <select
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:border-blue-500 focus:outline-none"
                defaultValue="vegetation"
              >
                <option value="vegetation">🌿 Vegetation Health (NDVI)</option>
                <option value="urban">🏙️ Urban Detection (NDBI)</option>
                <option value="water">💧 Water Detection (NDWI)</option>
                <option value="burn">🔥 Burn Area Severity (NBR)</option>
              </select>
            </div>

            <button
              onClick={runAnalysis}
              className="w-full py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-semibold rounded-lg transition"
            >
              🚀 RUN ANALYSIS
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-cyan-400">✅ Analysis Results</h3>
            <button
              onClick={() => setSelectedAnalysis(null)}
              className="text-xs px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-slate-300"
            >
              ← Back
            </button>
          </div>

          {/* Analysis Type */}
          <div className="bg-slate-700 rounded-lg p-3">
            <p className="text-xs text-slate-400">Analysis Type</p>
            <p className="font-semibold text-cyan-300">{selectedAnalysis.analysisType}</p>
          </div>

          {/* Statistics */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-300">📊 Statistics</h4>
            {Object.entries(selectedAnalysis.statistics).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center bg-slate-700 p-2 rounded text-xs">
                <span className="text-slate-400 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                <span className="font-semibold text-cyan-300">{value}</span>
              </div>
            ))}
          </div>

          {/* Spectral Indices */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-300">📈 Spectral Indices</h4>
            <div className="space-y-2">
              {Object.entries(selectedAnalysis.results).map(([index, values]) => (
                <div key={index} className="bg-slate-700 rounded-lg p-2">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-mono text-cyan-400 text-xs font-bold">{index.toUpperCase()}</span>
                    <span className="text-xs text-slate-400">
                      {Array.isArray(values) ? `${values.length} bands` : values}
                    </span>
                  </div>
                  {Array.isArray(values) && (
                    <div className="flex gap-1">
                      {values.map((val, i) => (
                        <div
                          key={i}
                          className="flex-1 h-8 rounded bg-gradient-to-t from-blue-600 to-cyan-400"
                          style={{
                            opacity: val,
                            height: `${val * 30}px`
                          }}
                          title={`${val.toFixed(2)}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => setSelectedAnalysis(null)}
            className="w-full mt-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition text-sm"
          >
            Run New Analysis
          </button>
        </>
      )}
    </div>
  )
}

export default AnalysisPanel
