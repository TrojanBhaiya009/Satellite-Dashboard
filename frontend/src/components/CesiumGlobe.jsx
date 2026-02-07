import { useState, useEffect, useRef, useCallback } from 'react'
import * as Cesium from 'cesium'
import 'cesium/Build/Cesium/Widgets/widgets.css'
import {
  SATELLITE_GROUPS,
  fetchSatelliteGroup,
  fetchISS,
  updateSatellitePositions,
  generateOrbitPath
} from '../services/satelliteTracker'

// Disable Cesium Ion
Cesium.Ion.defaultAccessToken = undefined

function CesiumGlobe() {
  const cesiumContainerRef = useRef(null)
  const viewerRef = useRef(null)
  const entitiesRef = useRef({})
  const orbitEntitiesRef = useRef({})
  const satellitesRef = useRef([])
  const [satellites, setSatellites] = useState([])
  const [selectedSat, setSelectedSat] = useState(null)
  const [activeGroups, setActiveGroups] = useState(['ISS', 'STARLINK', 'WEATHER'])
  const [loading, setLoading] = useState(true)
  const [showOrbits, setShowOrbits] = useState(true)
  const [satCount, setSatCount] = useState(0)
  const [clockSpeed, setClockSpeed] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [showPanel, setShowPanel] = useState(true)
  const [viewMode, setViewMode] = useState('3d')

  // Initialize Cesium Viewer
  useEffect(() => {
    if (!cesiumContainerRef.current || viewerRef.current) return

    const viewer = new Cesium.Viewer(cesiumContainerRef.current, {
      imageryProvider: new Cesium.ArcGisMapServerImageryProvider({
        url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer'
      }),
      terrainProvider: undefined,
      timeline: false,
      animation: false,
      homeButton: false,
      geocoder: false,
      navigationHelpButton: false,
      baseLayerPicker: false,
      sceneModePicker: false,
      fullscreenButton: false,
      selectionIndicator: false,
      infoBox: false,
      scene3DOnly: false,
      skyAtmosphere: new Cesium.SkyAtmosphere(),
      orderIndependentTranslucency: false,
    })

    // Globe styling
    const globe = viewer.scene.globe
    globe.enableLighting = true
    globe.showGroundAtmosphere = true
    globe.atmosphereLightIntensity = 10.0
    globe.atmosphereRayleighCoefficient = new Cesium.Cartesian3(5.5e-6, 13.0e-6, 28.4e-6)
    globe.atmosphereMieCoefficient = new Cesium.Cartesian3(21e-6, 21e-6, 21e-6)

    // Scene styling
    viewer.scene.backgroundColor = Cesium.Color.fromCssColorString('#05080f')
    viewer.scene.sun.show = true
    viewer.scene.moon.show = true
    viewer.scene.fog.enabled = false
    viewer.scene.highDynamicRange = false
    viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString('#0a1628')

    // Hide credits
    viewer.cesiumWidget.creditContainer.style.display = 'none'

    // Initial camera position — over Asia/Europe for a nice view
    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(30, 20, 20000000),
      orientation: {
        heading: 0,
        pitch: Cesium.Math.toRadians(-90),
        roll: 0
      }
    })

    // Click handler
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)
    handler.setInputAction((click) => {
      const picked = viewer.scene.pick(click.position)
      if (Cesium.defined(picked) && picked.id) {
        const sat = satellitesRef.current.find(s => s.id === picked.id.name || s.name === picked.id.name)
        if (sat) {
          setSelectedSat(sat)
          viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(
              sat.position.longitude,
              sat.position.latitude,
              sat.position.altitude + 500000
            ),
            orientation: {
              heading: 0,
              pitch: Cesium.Math.toRadians(-45),
              roll: 0
            },
            duration: 2
          })
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

    viewerRef.current = viewer

    return () => {
      handler.destroy()
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        viewerRef.current.destroy()
      }
      viewerRef.current = null
    }
  }, [])

  // Load satellites for active groups
  const loadSatellites = useCallback(async () => {
    setLoading(true)
    try {
      const results = await Promise.all(
        activeGroups.map(g => fetchSatelliteGroup(g))
      )
      const allSats = results.flat()

      const iss = await fetchISS()
      if (iss && !allSats.find(s => s.id === '25544')) {
        allSats.unshift(iss)
      }

      setSatellites(allSats)
      satellitesRef.current = allSats
      setSatCount(allSats.length)
    } catch (err) {
      console.error('Failed to load satellites:', err)
    } finally {
      setLoading(false)
    }
  }, [activeGroups])

  useEffect(() => {
    loadSatellites()
  }, [loadSatellites])

  // Create/recreate entities when satellite list composition changes (not positions)
  const prevSatIdsRef = useRef('')
  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer || viewer.isDestroyed()) return

    const filteredSats = searchQuery
      ? satellites.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
      : satellites

    // Only recreate entities when the list of IDs actually changes
    const currentIds = filteredSats.map(s => s.id).sort().join(',')
    if (currentIds === prevSatIdsRef.current && Object.keys(entitiesRef.current).length > 0) return
    prevSatIdsRef.current = currentIds

    // Clear old entities
    viewer.entities.removeAll()
    entitiesRef.current = {}
    orbitEntitiesRef.current = {}

    // Add satellite point entities
    filteredSats.forEach(sat => {
      const entity = viewer.entities.add({
        name: sat.id,
        position: Cesium.Cartesian3.fromDegrees(
          sat.position.longitude,
          sat.position.latitude,
          sat.position.altitude
        ),
        point: {
          pixelSize: 8,
          color: Cesium.Color.fromCssColorString(sat.color),
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 1,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          scaleByDistance: new Cesium.NearFarScalar(1.0e6, 1.5, 5.0e7, 0.6),
        },
        label: {
          text: sat.name,
          font: '13px monospace',
          fillColor: Cesium.Color.fromCssColorString(sat.color).withAlpha(0.95),
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 3,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cesium.Cartesian2(12, -4),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          show: filteredSats.length < 30,
          scale: 0.7,
          showBackground: true,
          backgroundColor: Cesium.Color.fromCssColorString('#0f172a').withAlpha(0.7),
          backgroundPadding: new Cesium.Cartesian2(6, 4),
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 15000000),
        }
      })
      entitiesRef.current[sat.id] = entity
    })

    // Add orbit paths
    if (showOrbits) {
      filteredSats.slice(0, 25).forEach(sat => {
        const path = generateOrbitPath(sat, 200)
        if (!path || path.length < 2) return

        const positions = Cesium.Cartesian3.fromDegreesArrayHeights(
          path.flatMap(p => [p.longitude, p.latitude, p.altitude])
        )

        const orbitEntity = viewer.entities.add({
          polyline: {
            positions,
            width: 1.5,
            material: new Cesium.PolylineGlowMaterialProperty({
              glowPower: 0.15,
              color: Cesium.Color.fromCssColorString(sat.color).withAlpha(0.4),
            }),
          }
        })
        orbitEntitiesRef.current[sat.id] = orbitEntity
      })
    }
  }, [satellites.length, activeGroups, showOrbits, searchQuery])

  // Highlight selected satellite
  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer || viewer.isDestroyed()) return

    // Reset all to default style
    Object.entries(entitiesRef.current).forEach(([id, entity]) => {
      if (entity.point) {
        entity.point.pixelSize = 8
        entity.point.outlineWidth = 1
      }
      if (entity.label) {
        entity.label.show = satellites.length < 30
      }
    })

    // Highlight selected
    if (selectedSat && entitiesRef.current[selectedSat.id]) {
      const entity = entitiesRef.current[selectedSat.id]
      if (entity.point) {
        entity.point.pixelSize = 14
        entity.point.outlineWidth = 3
      }
      if (entity.label) {
        entity.label.show = true
        entity.label.scale = 0.85
      }
    }

    // Highlight selected orbit
    Object.entries(orbitEntitiesRef.current).forEach(([id, entity]) => {
      if (entity.polyline) {
        const sat = satellitesRef.current.find(s => s.id === id)
        if (!sat) return
        const isSelected = selectedSat?.id === id
        entity.polyline.width = isSelected ? 3 : 1.5
        entity.polyline.material = new Cesium.PolylineGlowMaterialProperty({
          glowPower: isSelected ? 0.3 : 0.15,
          color: Cesium.Color.fromCssColorString(sat.color).withAlpha(isSelected ? 0.9 : 0.4),
        })
      }
    })
  }, [selectedSat])

  // Real-time position updates
  useEffect(() => {
    if (satellites.length === 0) return

    const interval = setInterval(() => {
      const now = new Date()
      setSatellites(prev => {
        const updated = updateSatellitePositions(prev, now)
        satellitesRef.current = updated

        // Update entity positions directly (fast path)
        const viewer = viewerRef.current
        if (viewer && !viewer.isDestroyed()) {
          updated.forEach(sat => {
            const entity = entitiesRef.current[sat.id]
            if (entity) {
              entity.position = Cesium.Cartesian3.fromDegrees(
                sat.position.longitude,
                sat.position.latitude,
                sat.position.altitude
              )
            }
          })
        }

        return updated
      })
    }, 1000 * (1 / clockSpeed))

    return () => clearInterval(interval)
  }, [satellites.length, clockSpeed])

  // Fly to satellite
  const flyToSatellite = (sat) => {
    setSelectedSat(sat)
    const viewer = viewerRef.current
    if (viewer && !viewer.isDestroyed()) {
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(
          sat.position.longitude,
          sat.position.latitude,
          sat.position.altitude + 500000
        ),
        orientation: {
          heading: 0,
          pitch: Cesium.Math.toRadians(-45),
          roll: 0
        },
        duration: 2
      })
    }
  }

  const resetView = () => {
    const viewer = viewerRef.current
    if (viewer && !viewer.isDestroyed()) {
      viewer.camera.flyHome(2)
      setSelectedSat(null)
    }
  }

  const switchViewMode = (mode) => {
    const viewer = viewerRef.current
    if (!viewer || viewer.isDestroyed()) return
    setViewMode(mode)
    switch (mode) {
      case '3d': viewer.scene.morphTo3D(1.5); break
      case '2.5d': viewer.scene.morphTo2D(1.5); break
      case 'columbus': viewer.scene.morphToColumbusView(1.5); break
    }
  }

  const toggleGroup = (groupKey) => {
    setActiveGroups(prev =>
      prev.includes(groupKey)
        ? prev.filter(g => g !== groupKey)
        : [...prev, groupKey]
    )
  }

  const filteredSatellites = searchQuery
    ? satellites.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : satellites

  return (
    <div className="cesium-globe-wrapper">
      {/* Cesium container - pure DOM */}
      <div ref={cesiumContainerRef} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }} />

      {/* Control Panels */}
      <div className="globe-overlay">
        {/* Top Bar */}
        <div className="globe-top-bar">
          <div className="globe-stat-badges">
            <div className="stat-badge">
              <span className="stat-icon">🛰️</span>
              <span className="stat-value">{satCount}</span>
              <span className="stat-label">Tracking</span>
            </div>
            <div className="stat-badge">
              <span className="stat-icon">📡</span>
              <span className="stat-value">{activeGroups.length}</span>
              <span className="stat-label">Groups</span>
            </div>
            <div className="stat-badge live-badge">
              <span className="live-dot"></span>
              <span className="stat-label">LIVE</span>
            </div>
          </div>

          <div className="globe-view-modes">
            <button className={`view-btn ${viewMode === '3d' ? 'active' : ''}`} onClick={() => switchViewMode('3d')} title="3D Globe">🌐 3D</button>
            <button className={`view-btn ${viewMode === '2.5d' ? 'active' : ''}`} onClick={() => switchViewMode('2.5d')} title="2D Map">🗺️ 2D</button>
            <button className={`view-btn ${viewMode === 'columbus' ? 'active' : ''}`} onClick={() => switchViewMode('columbus')} title="Columbus View">📐 CV</button>
          </div>
        </div>

        {/* Side Panel Toggle */}
        <button className="panel-toggle" onClick={() => setShowPanel(!showPanel)}>
          {showPanel ? '◀' : '▶'}
        </button>

        {/* Side Panel */}
        {showPanel && (
          <div className="globe-side-panel">
            <div className="panel-search">
              <input type="text" placeholder="Search satellites..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="search-input" />
            </div>

            <div className="panel-section">
              <h3 className="panel-section-title">Satellite Constellations</h3>
              <div className="group-grid">
                {Object.entries(SATELLITE_GROUPS).map(([key, group]) => (
                  <button key={key} className={`group-btn ${activeGroups.includes(key) ? 'active' : ''}`} onClick={() => toggleGroup(key)}
                    style={{ borderColor: activeGroups.includes(key) ? group.color : 'transparent', background: activeGroups.includes(key) ? `${group.color}15` : '' }}>
                    <span className="group-icon">{group.icon}</span>
                    <span className="group-name">{group.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="panel-section">
              <h3 className="panel-section-title">Controls</h3>
              <div className="controls-grid">
                <label className="control-item">
                  <span>Show Orbits</span>
                  <input type="checkbox" checked={showOrbits} onChange={(e) => setShowOrbits(e.target.checked)} className="control-toggle" />
                </label>
                <label className="control-item">
                  <span>Speed: {clockSpeed}x</span>
                  <input type="range" min="0.1" max="10" step="0.1" value={clockSpeed} onChange={(e) => setClockSpeed(parseFloat(e.target.value))} className="control-slider" />
                </label>
                <button className="control-btn" onClick={resetView}>🏠 Reset View</button>
                <button className="control-btn refresh-btn" onClick={loadSatellites}>🔄 Refresh Data</button>
              </div>
            </div>

            <div className="panel-section satellite-list-section">
              <h3 className="panel-section-title">Satellites ({filteredSatellites.length})</h3>
              <div className="satellite-list">
                {filteredSatellites.slice(0, 50).map(sat => (
                  <button key={sat.id} className={`sat-item ${selectedSat?.id === sat.id ? 'selected' : ''}`} onClick={() => flyToSatellite(sat)}>
                    <span className="sat-icon">{sat.icon}</span>
                    <div className="sat-info">
                      <span className="sat-name">{sat.name}</span>
                      <span className="sat-coords">{sat.position.latitude.toFixed(2)}°, {sat.position.longitude.toFixed(2)}° | {(sat.position.altitude / 1000).toFixed(0)} km</span>
                    </div>
                    <div className="sat-dot" style={{ background: sat.color }} />
                  </button>
                ))}
              </div>
            </div>

            {selectedSat && (
              <div className="panel-section selected-detail">
                <h3 className="panel-section-title">{selectedSat.icon} {selectedSat.name}</h3>
                <div className="detail-grid">
                  <div className="detail-item"><span className="detail-label">Latitude</span><span className="detail-value">{selectedSat.position.latitude.toFixed(4)}°</span></div>
                  <div className="detail-item"><span className="detail-label">Longitude</span><span className="detail-value">{selectedSat.position.longitude.toFixed(4)}°</span></div>
                  <div className="detail-item"><span className="detail-label">Altitude</span><span className="detail-value">{(selectedSat.position.altitude / 1000).toFixed(1)} km</span></div>
                  <div className="detail-item"><span className="detail-label">Inclination</span><span className="detail-value">{selectedSat.inclination?.toFixed(1)}°</span></div>
                  <div className="detail-item"><span className="detail-label">Period</span><span className="detail-value">{selectedSat.period} min</span></div>
                  {selectedSat.apogee && <div className="detail-item"><span className="detail-label">Apogee</span><span className="detail-value">{selectedSat.apogee} km</span></div>}
                  {selectedSat.perigee && <div className="detail-item"><span className="detail-label">Perigee</span><span className="detail-value">{selectedSat.perigee} km</span></div>}
                  <div className="detail-item"><span className="detail-label">NORAD ID</span><span className="detail-value">{selectedSat.id}</span></div>
                </div>
              </div>
            )}
          </div>
        )}

        {loading && (
          <div className="globe-loading">
            <div className="loading-spinner"></div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CesiumGlobe
