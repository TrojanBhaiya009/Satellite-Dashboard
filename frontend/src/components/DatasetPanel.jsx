import React from 'react'
import { useDatasetStore } from '../store'

function DatasetPanel({ datasets }) {
  const selectedDataset = useDatasetStore(state => state.selectedDataset)
  const setSelectedDataset = useDatasetStore(state => state.setSelectedDataset)

  return (
    <div className="p-4 space-y-2 max-h-[500px] overflow-y-auto">
      {datasets.length === 0 ? (
        <div className="text-center text-slate-400 py-8">
          <p className="text-sm">No datasets yet</p>
          <p className="text-xs text-slate-500 mt-1">Create one to get started</p>
        </div>
      ) : (
        datasets.map(dataset => (
          <div
            key={dataset._id}
            onClick={() => setSelectedDataset(dataset)}
            className={`p-3 rounded-lg border cursor-pointer transition ${
              selectedDataset?._id === dataset._id
                ? 'bg-blue-900 border-blue-600 shadow-lg'
                : 'bg-slate-700 border-slate-600 hover:border-slate-500'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-semibold text-white text-sm truncate pr-2">{dataset.name}</h4>
              <span className="text-xs bg-slate-600 px-2 py-1 rounded whitespace-nowrap">{dataset.satellite}</span>
            </div>
            <div className="space-y-1 text-xs text-slate-300">
              <p>📍 {dataset.region}</p>
              <p>📅 {new Date(dataset.acquisitionDate).toLocaleDateString()}</p>
              <p>☁️ Cloud: {dataset.cloudCover}%</p>
              <p>📏 Resolution: {dataset.resolution}m</p>
              <p className="text-blue-400 mt-2">📥 {dataset.satellite === 'Sentinel-2' ? 'Copernicus' : 'USGS'}</p>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

export default DatasetPanel
