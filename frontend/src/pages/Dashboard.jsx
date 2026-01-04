import React, { useEffect, useState } from 'react'
import { useUser } from '@clerk/clerk-react'
import { useDatasetStore, useAnalysisStore } from '../store'
import { mockDatasets, mockAnalysis } from '../services/mockData'
import MapComponent from '../components/Map'
import Toolbar from '../components/Toolbar'
import DatasetPanel from '../components/DatasetPanel'
import AnalysisPanel from '../components/AnalysisPanel'
import toast from 'react-hot-toast'
import '../styles/Dashboard.css'

function Dashboard() {
  const { user } = useUser()
  const [view, setView] = useState('overview')
  
  // Zustand store selectors
  const datasets = useDatasetStore(state => state.datasets)
  const setDatasets = useDatasetStore(state => state.setDatasets)
  const selectedDataset = useDatasetStore(state => state.selectedDataset)
  const setSelectedDataset = useDatasetStore(state => state.setSelectedDataset)
  const analyses = useAnalysisStore(state => state.analyses)
  const setAnalyses = useAnalysisStore(state => state.setAnalyses)

  // Load mock data on mount
  useEffect(() => {
    setDatasets(mockDatasets)
    setAnalyses(mockAnalysis)
    
    if (mockDatasets.length > 0) {
      setSelectedDataset(mockDatasets[0])
    }
    
    toast.success('✅ Datasets loaded successfully!')
  }, [setDatasets, setAnalyses, setSelectedDataset])

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div>
          <h1 className="dashboard-title">🛰️ SatelliteFusion Dashboard</h1>
          <p className="dashboard-subtitle">Real-time Satellite Data Analysis by {user?.firstName || 'User'}</p>
        </div>
        <div className="dashboard-tabs">
          <button 
            onClick={() => setView('overview')} 
            className={`tab-button ${view === 'overview' ? 'active' : ''}`}
          >
            Overview
          </button>
          <button 
            onClick={() => setView('analysis')} 
            className={`tab-button ${view === 'analysis' ? 'active' : ''}`}
          >
            Analysis
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="dashboard-content">
        {/* Left Panel - Toolbar & Datasets */}
        <div className="panel panel-left">
          <Toolbar />
          {datasets.length > 0 ? (
            <DatasetPanel datasets={datasets} />
          ) : (
            <div className="empty-state">
              <p>📡 No datasets loaded. Creating mock data...</p>
            </div>
          )}
        </div>

        {/* Center - Map */}
        <div className="panel panel-center">
          <MapComponent />
        </div>

        {/* Right Panel - Details & Analysis */}
        <div className="panel panel-right">
          {view === 'overview' ? (
            <>
              <h2 className="panel-header">📊 Dataset Info</h2>
              {selectedDataset ? (
                <>
                  <div className="dataset-info">
                    <div className="dataset-info-row">
                      <span className="dataset-info-label">Name:</span>
                      <span className="dataset-info-value">{selectedDataset.name}</span>
                    </div>
                    <div className="dataset-info-row">
                      <span className="dataset-info-label">Satellite:</span>
                      <span className="dataset-info-value">{selectedDataset.satellite}</span>
                    </div>
                    <div className="dataset-info-row">
                      <span className="dataset-info-label">Processing:</span>
                      <span className="dataset-info-value">{selectedDataset.level}</span>
                    </div>
                    <div className="dataset-info-row">
                      <span className="dataset-info-label">Region:</span>
                      <span className="dataset-info-value">{selectedDataset.region}</span>
                    </div>
                    <div className="dataset-info-row">
                      <span className="dataset-info-label">Date:</span>
                      <span className="dataset-info-value">{new Date(selectedDataset.acquisitionDate).toLocaleDateString()}</span>
                    </div>
                    <div className="dataset-info-row">
                      <span className="dataset-info-label">Cloud Cover:</span>
                      <span className="dataset-info-value">{selectedDataset.cloudCover}%</span>
                    </div>
                    <div className="dataset-info-row">
                      <span className="dataset-info-label">Resolution:</span>
                      <span className="dataset-info-value">{selectedDataset.resolution}m</span>
                    </div>
                    
                    {/* Bands Info */}
                    <div className="mt-3 pt-3 border-t border-slate-600">
                      <p className="text-xs font-semibold text-cyan-400 mb-2">📊 Available Bands</p>
                      <div className="space-y-1">
                        {Object.entries(selectedDataset.bands).slice(0, 4).map(([bandId, band]) => (
                          <div key={bandId} className="text-xs text-slate-400">
                            <span className="font-mono text-cyan-300">{bandId}</span> - {band.name} ({band.wavelength})
                          </div>
                        ))}
                        {Object.keys(selectedDataset.bands).length > 4 && (
                          <p className="text-xs text-slate-500">+ {Object.keys(selectedDataset.bands).length - 4} more bands</p>
                        )}
                      </div>
                    </div>

                    {/* Download Info */}
                    <div className="mt-3 pt-3 border-t border-slate-600">
                      <p className="text-xs font-semibold text-green-400 mb-2">📥 Download</p>
                      <a 
                        href={selectedDataset.metadata.downloadUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-blue-400 hover:text-blue-300 break-all"
                      >
                        {selectedDataset.metadata.source}
                      </a>
                      <p className="text-xs text-slate-500 mt-1">Format: {selectedDataset.metadata.fileFormat || '.SAFE'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setView('analysis')}
                    className="primary-button"
                  >
                    🚀 Run Analysis
                  </button>
                </>
              ) : (
                <div className="empty-state">
                  <p>👈 Select a dataset to view details</p>
                </div>
              )}
            </>
          ) : (
            <>
              <h2 className="panel-header">🔬 Spectral Analysis</h2>
              {selectedDataset ? (
                <AnalysisPanel dataset={selectedDataset} />
              ) : (
                <div className="empty-state">
                  <p>👈 Select a dataset to analyze</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
