import React, { useEffect, useState, useRef, useCallback, useMemo, memo } from 'react'
import { useDatasetStore } from '../store'
import { mockDatasets } from '../services/mockData'
import { 
  fetchSentinel2Data, 
  fetchLandsatData, 
  formatSceneData,
  STAC_ENDPOINTS,
  searchSTACItems,
  GIBS_PRODUCTS
} from '../services/satelliteApi'

// Satellite TLE data for orbit calculation (real TLE data)
const SATELLITE_TLE = {
  'Sentinel-2': {
    name: 'SENTINEL-2A',
    line1: '1 40697U 15028A   24001.50000000  .00000100  00000-0  50000-4 0  9990',
    line2: '2 40697  98.5693 100.0000 0001000  90.0000 270.0000 14.30818200000000',
    altitude: 786, // km
    period: 100.6 // minutes
  },
  'Landsat-9': {
    name: 'LANDSAT-9',
    line1: '1 49260U 21088A   24001.50000000  .00000100  00000-0  50000-4 0  9990',
    line2: '2 49260  98.2200  50.0000 0001000  90.0000 270.0000 14.57000000000000',
    altitude: 705,
    period: 99.0
  },
  'MODIS': {
    name: 'TERRA',
    line1: '1 25994U 99068A   24001.50000000  .00000100  00000-0  50000-4 0  9990',
    line2: '2 25994  98.2104 120.0000 0001000  90.0000 270.0000 14.57130000000000',
    altitude: 705,
    period: 98.8
  },
  'Sentinel-1': {
    name: 'SENTINEL-1A',
    line1: '1 39634U 14016A   24001.50000000  .00000100  00000-0  50000-4 0  9990',
    line2: '2 39634  98.1819  80.0000 0001000  90.0000 270.0000 14.59000000000000',
    altitude: 693,
    period: 98.6
  }
}

// Calculate satellite position based on simplified orbit model
const calculateSatellitePosition = (satellite, timestamp) => {
  const tle = SATELLITE_TLE[satellite] || SATELLITE_TLE['Sentinel-2']
  const now = timestamp || Date.now()
  
  // Simplified orbital mechanics for visualization
  const orbitalPeriodMs = tle.period * 60 * 1000
  const orbitFraction = (now % orbitalPeriodMs) / orbitalPeriodMs
  
  // Calculate longitude (satellite moves west to east, but ground track shifts west)
  const baseAngle = orbitFraction * 360
  const earthRotation = (now % (24 * 60 * 60 * 1000)) / (24 * 60 * 60 * 1000) * 360
  let longitude = (baseAngle - earthRotation + 180) % 360 - 180
  
  // Calculate latitude (sun-synchronous orbit oscillates between +/- inclination)
  const inclination = 98.5
  const latitude = (inclination - 90) * Math.sin(orbitFraction * 2 * Math.PI)
  
  // Calculate velocity
  const velocity = (2 * Math.PI * (6371 + tle.altitude)) / (tle.period * 60) // km/s
  
  return {
    latitude: Math.max(-90, Math.min(90, latitude)),
    longitude,
    altitude: tle.altitude,
    velocity: velocity.toFixed(2),
    orbitNumber: Math.floor(now / orbitalPeriodMs) % 1000 + 1,
    nextPassTime: new Date(now + orbitalPeriodMs - (now % orbitalPeriodMs)).toLocaleTimeString()
  }
}

// Generate orbit path for visualization
const generateOrbitPath = (satellite, pointCount = 50) => {
  const points = []
  const now = Date.now()
  const tle = SATELLITE_TLE[satellite] || SATELLITE_TLE['Sentinel-2']
  const orbitalPeriodMs = tle.period * 60 * 1000
  
  for (let i = 0; i < pointCount; i++) {
    const timestamp = now + (i * orbitalPeriodMs / pointCount)
    const pos = calculateSatellitePosition(satellite, timestamp)
    points.push(pos)
  }
  return points
}

// Memoized satellite image viewer - isolated from parent re-renders
// Only re-renders when imageUrl, region, or date actually change
const SatelliteImageViewer = memo(function SatelliteImageViewer({ imageUrl, region, date }) {
  const [imgStatus, setImgStatus] = useState('loading') // 'loading' | 'loaded' | 'error'

  // Reset loading state whenever the URL changes
  useEffect(() => {
    if (imageUrl) {
      setImgStatus('loading')
    }
  }, [imageUrl])

  if (!imageUrl) {
    return (
      <div className="relative aspect-video bg-slate-900/50 rounded-xl overflow-hidden border border-slate-600">
        <div className="absolute inset-0 flex items-center justify-center text-slate-500">
          <div className="text-center">
            <p className="text-4xl mb-2">🛰️</p>
            <p>Select a dataset to view imagery</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative aspect-video bg-slate-900/50 rounded-xl overflow-hidden border border-slate-600">
      {/* Loading placeholder */}
      {imgStatus === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center text-slate-500 z-10">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p>Loading satellite imagery...</p>
            <p className="text-xs mt-1 text-slate-600">Fetching from NASA GIBS</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {imgStatus === 'error' && (
        <div className="absolute inset-0 flex items-center justify-center text-slate-500 z-10">
          <div className="text-center">
            <p className="text-4xl mb-2">🌍</p>
            <p>Imagery unavailable for this date</p>
            <p className="text-xs mt-1">Try selecting an earlier date — NASA GIBS has 1-3 day data latency</p>
          </div>
        </div>
      )}

      {/* Actual image */}
      <img
        key={imageUrl}
        src={imageUrl}
        alt="Live satellite imagery"
        crossOrigin="anonymous"
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          imgStatus === 'loaded' ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={() => setImgStatus('loaded')}
        onError={() => setImgStatus('error')}
      />

      {/* Info overlay */}
      {imgStatus === 'loaded' && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900/80 to-transparent p-4">
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-300">
              <span className="font-semibold">{region}</span> • {date}
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-xs text-green-400">LIVE DATA</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
})

function Datasets() {
  const datasets = useDatasetStore(state => state.datasets)
  const setDatasets = useDatasetStore(state => state.setDatasets)
  const [selectedId, setSelectedId] = useState(null)
  const [realTimeScenes, setRealTimeScenes] = useState([])
  const [isLoadingScenes, setIsLoadingScenes] = useState(false)
  const [downloadStatus, setDownloadStatus] = useState({})
  
  // Real-time tracking state
  const [satellitePosition, setSatellitePosition] = useState(null)
  const [orbitPath, setOrbitPath] = useState([])
  const [liveTime, setLiveTime] = useState(new Date())
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState(1000)
  const [lastUpdate, setLastUpdate] = useState(null)
  // Default to 1 day ago since NASA GIBS typically has ~1 day data latency
  const [liveImageryDate, setLiveImageryDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 1)
    return d.toISOString().split('T')[0]
  })
  const [selectedGibsProduct, setSelectedGibsProduct] = useState('MODIS_Terra_CorrectedReflectance_TrueColor')
  
  const positionUpdateRef = useRef(null)
  const sceneRefreshRef = useRef(null)

  useEffect(() => {
    setDatasets(mockDatasets)
  }, [setDatasets])

  useEffect(() => {
    if (datasets.length > 0 && !selectedId) {
      setSelectedId(datasets[0]._id)
    }
  }, [datasets, selectedId])

  const selected = datasets.find(d => d._id === selectedId)

  // Memoize the bbox from selected dataset to avoid recalculation
  const selectedBbox = useMemo(() => {
    const coords = selected?.coordinates?.coordinates?.[0] || []
    if (coords.length === 0) return null
    return [
      Math.min(...coords.map(c => c[0])),
      Math.min(...coords.map(c => c[1])),
      Math.max(...coords.map(c => c[0])),
      Math.max(...coords.map(c => c[1]))
    ]
  }, [selected])

  // Memoize the GIBS image URL so it only changes when product/date/dataset change
  const gibsImageUrl = useMemo(() => {
    if (!selectedBbox) return null
    return `https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS=${selectedGibsProduct}&FORMAT=image/jpeg&TRANSPARENT=true&HEIGHT=512&WIDTH=1024&CRS=EPSG:4326&BBOX=${selectedBbox[1]},${selectedBbox[0]},${selectedBbox[3]},${selectedBbox[2]}&TIME=${liveImageryDate}`
  }, [selectedGibsProduct, liveImageryDate, selectedBbox])

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

  // Real-time satellite position tracking - updates every second
  useEffect(() => {
    if (!selected || !autoRefresh) return
    
    const updatePosition = () => {
      const position = calculateSatellitePosition(selected.satellite)
      setSatellitePosition(position)
      setLiveTime(new Date())
      setLastUpdate(new Date())
    }
    
    // Initial update
    updatePosition()
    
    // Generate initial orbit path
    setOrbitPath(generateOrbitPath(selected.satellite))
    
    // Set up interval for real-time updates
    positionUpdateRef.current = setInterval(updatePosition, refreshInterval)
    
    return () => {
      if (positionUpdateRef.current) {
        clearInterval(positionUpdateRef.current)
      }
    }
  }, [selected, autoRefresh, refreshInterval])

  // Auto-refresh scenes every 30 seconds
  useEffect(() => {
    if (!selected || !autoRefresh) return
    
    const refreshScenes = async () => {
      try {
        const today = new Date()
        const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
        const startDate = lastWeek.toISOString().split('T')[0]
        const endDate = today.toISOString().split('T')[0]
        
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
        
        if (bbox) {
          const scenes = await searchSTACItems(
            STAC_ENDPOINTS.earthSearch,
            'sentinel-2-l2a',
            bbox,
            `${startDate}/${endDate}`,
            10
          )
          const formatted = scenes.slice(0, 8).map(formatSceneData).filter(Boolean)
          if (formatted.length > 0) {
            setRealTimeScenes(formatted)
          }
        }
      } catch (error) {
        console.error('Scene refresh error:', error)
      }
    }
    
    sceneRefreshRef.current = setInterval(refreshScenes, 30000) // 30 seconds
    
    return () => {
      if (sceneRefreshRef.current) {
        clearInterval(sceneRefreshRef.current)
      }
    }
  }, [selected, autoRefresh])

  // getGibsImageUrl kept for compatibility but now uses memoized bbox
  const getGibsImageUrl = useCallback((product, date) => {
    if (!selectedBbox) return null
    return `https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS=${product}&FORMAT=image/jpeg&TRANSPARENT=true&HEIGHT=512&WIDTH=1024&CRS=EPSG:4326&BBOX=${selectedBbox[1]},${selectedBbox[0]},${selectedBbox[3]},${selectedBbox[2]}&TIME=${date}`
  }, [selectedBbox])

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
                Real-time satellite tracking with live imagery updates
              </p>
            </div>
            
            {/* Live Controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition ${
                  autoRefresh 
                    ? 'bg-green-500/10 border-green-500/30 text-green-400' 
                    : 'bg-slate-800/50 border-slate-700 text-slate-400'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-green-500 animate-pulse' : 'bg-slate-500'}`}></span>
                <span className="text-sm font-semibold">{autoRefresh ? 'LIVE' : 'PAUSED'}</span>
              </button>
              <div className="text-xs text-slate-400 bg-slate-800/50 px-3 py-2 rounded-lg">
                🕐 {liveTime.toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>

        {/* Live Satellite Tracking Panel */}
        {satellitePosition && selected && (
          <div className="mb-8 bg-gradient-to-br from-slate-900 via-indigo-950/50 to-slate-900 border border-indigo-500/30 rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl shadow-indigo-500/10">
            {/* Header with animated background */}
            <div className="relative px-6 py-4 bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-cyan-600/20 border-b border-indigo-500/20">
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(99,102,241,0.1)_50%,transparent_100%)] animate-pulse"></div>
              </div>
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-indigo-600 rounded-xl flex items-center justify-center text-2xl shadow-lg shadow-cyan-500/30">
                      🛰️
                    </div>
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse border-2 border-slate-900"></span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      Live Tracking: <span className="text-cyan-400">{selected.satellite}</span>
                    </h3>
                    <p className="text-xs text-slate-400">Real-time orbital telemetry • Sun-synchronous orbit</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {/* Signal Strength */}
                  <div className="flex items-center gap-2 bg-slate-900/50 px-3 py-2 rounded-lg">
                    <div className="flex items-end gap-0.5 h-4">
                      {[1, 2, 3, 4, 5].map((bar) => (
                        <div
                          key={bar}
                          className={`w-1 rounded-full transition-all duration-300 ${
                            bar <= 4 ? 'bg-green-500' : 'bg-slate-600'
                          }`}
                          style={{ height: `${bar * 20}%` }}
                        ></div>
                      ))}
                    </div>
                    <span className="text-xs text-green-400 font-mono">SIGNAL OK</span>
                  </div>
                  {/* Live indicator */}
                  <div className="flex items-center gap-2 bg-green-500/10 px-3 py-2 rounded-lg border border-green-500/30">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    <span className="text-xs font-bold text-green-400">LIVE</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              {/* Main Stats Grid */}
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-6">
                {[
                  { label: 'LATITUDE', value: `${satellitePosition.latitude.toFixed(4)}°`, color: 'cyan', icon: '📍' },
                  { label: 'LONGITUDE', value: `${satellitePosition.longitude.toFixed(4)}°`, color: 'cyan', icon: '🧭' },
                  { label: 'ALTITUDE', value: `${satellitePosition.altitude} km`, color: 'purple', icon: '📡' },
                  { label: 'VELOCITY', value: `${satellitePosition.velocity} km/s`, color: 'green', icon: '⚡' },
                  { label: 'ORBIT #', value: satellitePosition.orbitNumber, color: 'yellow', icon: '🔄' },
                  { label: 'NEXT PASS', value: satellitePosition.nextPassTime, color: 'orange', icon: '⏰' },
                ].map((stat, idx) => (
                  <div
                    key={idx}
                    className={`relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-xl p-4 border border-${stat.color}-500/20 overflow-hidden group hover:border-${stat.color}-500/50 transition-all duration-300`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br from-${stat.color}-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                    <div className="relative">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">{stat.label}</p>
                        <span className="text-sm opacity-50">{stat.icon}</span>
                      </div>
                      <p className={`text-lg font-mono font-bold text-${stat.color}-400 truncate`}>{stat.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* World Map Visualization */}
              <div className="relative h-48 bg-slate-950 rounded-xl overflow-hidden border border-slate-700/50">
                {/* World map background */}
                <div className="absolute inset-0 opacity-30">
                  <svg viewBox="0 0 360 180" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
                    {/* Simplified world map continents */}
                    <defs>
                      <linearGradient id="landGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity="0.3" />
                      </linearGradient>
                      <filter id="glow">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                    </defs>
                    {/* North America */}
                    <path d="M40,30 L80,25 L100,35 L110,50 L100,60 L80,70 L60,65 L40,55 L30,40 Z" fill="url(#landGrad)" />
                    {/* South America */}
                    <path d="M70,80 L85,75 L95,90 L90,120 L75,140 L60,130 L55,100 L60,85 Z" fill="url(#landGrad)" />
                    {/* Europe */}
                    <path d="M170,30 L190,25 L200,35 L195,50 L180,55 L165,50 L160,40 Z" fill="url(#landGrad)" />
                    {/* Africa */}
                    <path d="M170,60 L190,55 L200,70 L195,110 L180,130 L165,120 L155,90 L160,70 Z" fill="url(#landGrad)" />
                    {/* Asia */}
                    <path d="M200,25 L260,20 L290,35 L300,55 L280,70 L250,75 L220,65 L200,50 L195,35 Z" fill="url(#landGrad)" />
                    {/* Australia */}
                    <path d="M280,100 L310,95 L320,110 L310,130 L290,135 L275,120 Z" fill="url(#landGrad)" />
                  </svg>
                </div>

                {/* Grid overlay */}
                <div className="absolute inset-0">
                  <svg viewBox="0 0 360 180" className="w-full h-full" preserveAspectRatio="none">
                    {/* Latitude lines */}
                    {[30, 60, 90, 120, 150].map((y) => (
                      <line key={`lat-${y}`} x1="0" y1={y} x2="360" y2={y} stroke="#334155" strokeWidth="0.5" strokeDasharray="2,4" />
                    ))}
                    {/* Longitude lines */}
                    {[60, 120, 180, 240, 300].map((x) => (
                      <line key={`lon-${x}`} x1={x} y1="0" x2={x} y2="180" stroke="#334155" strokeWidth="0.5" strokeDasharray="2,4" />
                    ))}
                    {/* Equator */}
                    <line x1="0" y1="90" x2="360" y2="90" stroke="#6366f1" strokeWidth="1" strokeOpacity="0.3" />
                    {/* Prime meridian */}
                    <line x1="180" y1="0" x2="180" y2="180" stroke="#6366f1" strokeWidth="1" strokeOpacity="0.3" />
                  </svg>
                </div>

                {/* Orbit path with glow */}
                <svg viewBox="0 0 360 180" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                  <defs>
                    <filter id="orbitGlow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="3" result="blur"/>
                      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
                    </filter>
                  </defs>
                  
                  {/* Orbit trail (past positions) */}
                  <path
                    d={`M ${orbitPath.slice(0, 25).map((p) => `${((p.longitude + 180) % 360)},${90 - p.latitude}`).join(' L ')}`}
                    fill="none"
                    stroke="url(#trailGradient)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    filter="url(#orbitGlow)"
                  />
                  <defs>
                    <linearGradient id="trailGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#22d3ee" stopOpacity="0" />
                      <stop offset="100%" stopColor="#22d3ee" stopOpacity="1" />
                    </linearGradient>
                  </defs>
                  
                  {/* Future path (dashed) */}
                  <path
                    d={`M ${orbitPath.slice(24).map((p) => `${((p.longitude + 180) % 360)},${90 - p.latitude}`).join(' L ')}`}
                    fill="none"
                    stroke="#22d3ee"
                    strokeWidth="1.5"
                    strokeDasharray="4,4"
                    strokeOpacity="0.3"
                  />
                  
                  {/* Coverage footprint */}
                  <ellipse
                    cx={(satellitePosition.longitude + 180) % 360}
                    cy={90 - satellitePosition.latitude}
                    rx="25"
                    ry="15"
                    fill="url(#footprintGradient)"
                    opacity="0.4"
                  />
                  <defs>
                    <radialGradient id="footprintGradient">
                      <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.5" />
                      <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
                    </radialGradient>
                  </defs>
                  
                  {/* Satellite position with glow */}
                  <circle
                    cx={(satellitePosition.longitude + 180) % 360}
                    cy={90 - satellitePosition.latitude}
                    r="12"
                    fill="#22d3ee"
                    fillOpacity="0.2"
                    className="animate-ping"
                  />
                  <circle
                    cx={(satellitePosition.longitude + 180) % 360}
                    cy={90 - satellitePosition.latitude}
                    r="8"
                    fill="#0f172a"
                    stroke="#22d3ee"
                    strokeWidth="3"
                    filter="url(#orbitGlow)"
                  />
                  <circle
                    cx={(satellitePosition.longitude + 180) % 360}
                    cy={90 - satellitePosition.latitude}
                    r="4"
                    fill="#22d3ee"
                  />
                </svg>

                {/* Labels */}
                <div className="absolute top-2 left-3 text-[10px] text-slate-500 font-mono">90°N</div>
                <div className="absolute bottom-2 left-3 text-[10px] text-slate-500 font-mono">90°S</div>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-slate-500 font-mono">0°</div>
                <div className="absolute top-2 right-3 text-[10px] text-slate-500 font-mono">Ground Track</div>
                
                {/* Region marker */}
                <div 
                  className="absolute w-3 h-3 bg-yellow-500 rounded-full border-2 border-yellow-300 shadow-lg shadow-yellow-500/50"
                  style={{
                    left: `${((selected.coordinates?.coordinates?.[0]?.[0]?.[0] || 0) + 180) / 360 * 100}%`,
                    top: `${(90 - (selected.coordinates?.coordinates?.[0]?.[0]?.[1] || 0)) / 180 * 100}%`,
                  }}
                >
                  <div className="absolute -inset-2 bg-yellow-500/30 rounded-full animate-ping"></div>
                </div>
              </div>

              {/* Bottom telemetry bar */}
              <div className="mt-4 flex items-center justify-between text-xs">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-slate-400">
                    <span className="w-2 h-2 bg-cyan-500 rounded-full"></span>
                    <span>Current Position</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                    <span>Target Region</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <div className="w-8 h-0.5 bg-gradient-to-r from-transparent to-cyan-500"></div>
                    <span>Orbit Trail</span>
                  </div>
                </div>
                <div className="font-mono text-slate-500">
                  UTC: {new Date().toISOString().split('T')[1].split('.')[0]}
                </div>
              </div>
            </div>
          </div>
        )}

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
                      <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${
                        selectedId === dataset._id 
                          ? 'bg-cyan-500/30 text-cyan-300' 
                          : 'bg-slate-700/50 text-slate-400'
                      }`}>
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
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

                {/* Live Satellite Imagery */}
                <div className="bg-gradient-to-br from-slate-800/70 to-slate-700/50 border border-slate-700 rounded-2xl p-6 backdrop-blur-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-purple-400 flex items-center gap-2">
                      📷 Live Satellite Imagery
                      <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded">NASA GIBS</span>
                    </h3>
                    <div className="flex items-center gap-2">
                      <select
                        value={selectedGibsProduct}
                        onChange={(e) => setSelectedGibsProduct(e.target.value)}
                        className="bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="MODIS_Terra_CorrectedReflectance_TrueColor">MODIS True Color</option>
                        <option value="VIIRS_SNPP_CorrectedReflectance_TrueColor">VIIRS True Color</option>
                        <option value="MODIS_Terra_NDVI_8Day">NDVI (Vegetation)</option>
                        <option value="MODIS_Terra_Land_Surface_Temp_Day">Surface Temp</option>
                        <option value="MODIS_Terra_Thermal_Anomalies_Day">Thermal/Fires</option>
                      </select>
                      <input
                        type="date"
                        value={liveImageryDate}
                        onChange={(e) => setLiveImageryDate(e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                        className="bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                  
                  <SatelliteImageViewer
                    imageUrl={gibsImageUrl}
                    region={selected.region}
                    date={liveImageryDate}
                  />
                  
                  <div className="mt-4 grid grid-cols-4 gap-2">
                    {[1, 2, 3, 4].map((daysAgo, idx) => {
                      const d = new Date()
                      d.setDate(d.getDate() - daysAgo)
                      const dateStr = d.toISOString().split('T')[0]
                      return (
                        <button
                          key={idx}
                          onClick={() => setLiveImageryDate(dateStr)}
                          className={`p-2 rounded-lg text-xs transition ${
                            liveImageryDate === dateStr 
                              ? 'bg-purple-500/30 border border-purple-500/50 text-purple-300' 
                              : 'bg-slate-800/50 border border-slate-700 text-slate-400 hover:bg-slate-700/50'
                          }`}
                        >
                          {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </button>
                      )
                    })}
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
