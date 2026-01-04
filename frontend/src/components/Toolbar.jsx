import React from 'react'
import toast from 'react-hot-toast'

function Toolbar() {
  return (
    <div className="p-4 border-b border-slate-700">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-cyan-400">📡 Datasets</h2>
        <button
          onClick={() => toast.info('📥 Download from Copernicus or USGS to add new datasets', { icon: 'ℹ️' })}
          className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition"
          title="Add datasets from Copernicus or USGS"
        >
          + Add Dataset
        </button>
      </div>
      <p className="text-xs text-slate-400 mt-2">
        💾 Select a dataset below to view details and run analysis
      </p>
    </div>
  )
}

export default Toolbar
