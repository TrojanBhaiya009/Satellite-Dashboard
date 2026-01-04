import { create } from 'zustand'

export const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('token') || null,
  isLoading: false,
  error: null,

  setUser: (user) => set({ user }),
  setToken: (token) => {
    if (token) {
      localStorage.setItem('token', token)
    } else {
      localStorage.removeItem('token')
    }
    set({ token })
  },
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  
  logout: () => {
    localStorage.removeItem('token')
    set({ user: null, token: null })
  }
}))

export const useDatasetStore = create((set) => ({
  datasets: [],
  selectedDataset: null,
  isLoading: false,

  setDatasets: (datasets) => set({ datasets }),
  setSelectedDataset: (dataset) => set({ selectedDataset: dataset }),
  addDataset: (dataset) => set((state) => ({
    datasets: [dataset, ...state.datasets]
  })),
  removeDataset: (id) => set((state) => ({
    datasets: state.datasets.filter(d => d._id !== id)
  })),
  setLoading: (isLoading) => set({ isLoading })
}))

export const useAnalysisStore = create((set) => ({
  analyses: [],
  selectedAnalysis: null,
  activeAnalysis: null,
  isLoading: false,

  setAnalyses: (analyses) => set({ analyses }),
  setSelectedAnalysis: (analysis) => set({ selectedAnalysis: analysis }),
  setActiveAnalysis: (analysis) => set({ activeAnalysis: analysis }),
  addAnalysis: (analysis) => set((state) => ({
    analyses: [analysis, ...state.analyses]
  })),
  updateAnalysis: (id, updates) => set((state) => ({
    analyses: state.analyses.map(a => a._id === id ? { ...a, ...updates } : a),
    activeAnalysis: state.activeAnalysis?._id === id ? { ...state.activeAnalysis, ...updates } : state.activeAnalysis
  })),
  removeAnalysis: (id) => set((state) => ({
    analyses: state.analyses.filter(a => a._id !== id)
  })),
  setLoading: (isLoading) => set({ isLoading })
}))

export const useMapStore = create((set) => ({
  center: [20, 78],
  zoom: 4,
  selectedRegion: null,
  activeLayers: ['satellite-imagery'],

  setCenter: (center) => set({ center }),
  setZoom: (zoom) => set({ zoom }),
  setSelectedRegion: (region) => set({ selectedRegion: region }),
  toggleLayer: (layer) => set((state) => ({
    activeLayers: state.activeLayers.includes(layer)
      ? state.activeLayers.filter(l => l !== layer)
      : [...state.activeLayers, layer]
  }))
}))
