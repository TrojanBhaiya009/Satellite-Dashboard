import { useRef, useMemo, useState, useEffect, useCallback } from 'react'
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber'
import { OrbitControls, Stars, Html } from '@react-three/drei'
import * as THREE from 'three'
import { fetchNaturalEvents } from '../services/satelliteApi'
import { fetchISS } from '../services/satelliteTracker'

// ── Helpers ──────────────────────────────────────────────────
function latLonToVec3(lat, lon, radius) {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lon + 180) * (Math.PI / 180)
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  )
}

// Category config — colours + icons for NASA EONET event types
const EVENT_CATEGORIES = {
  wildfires:    { label: 'Wildfires',     icon: '🔥', color: '#ef4444' },
  severeStorms: { label: 'Severe Storms', icon: '🌀', color: '#8b5cf6' },
  volcanoes:    { label: 'Volcanoes',     icon: '🌋', color: '#f97316' },
  floods:       { label: 'Floods',        icon: '🌊', color: '#3b82f6' },
  earthquakes:  { label: 'Earthquakes',   icon: '⚡', color: '#eab308' },
  seaLakeIce:   { label: 'Sea & Ice',     icon: '❄️', color: '#06b6d4' },
  landslides:   { label: 'Landslides',    icon: '⛰️', color: '#a3622a' },
  snow:         { label: 'Snow',          icon: '🌨️', color: '#cbd5e1' },
  drought:      { label: 'Drought',       icon: '☀️', color: '#d97706' },
}
const DEFAULT_CAT = { label: 'Event', icon: '📡', color: '#94a3b8' }
function getCat(id) { return EVENT_CATEGORIES[id] || DEFAULT_CAT }

// ── Sun position ─────────────────────────────────────────────
function getSunPosition(date = new Date()) {
  const jd = date.getTime() / 86400000 + 2440587.5
  const n = jd - 2451545.0
  const L = (280.460 + 0.9856474 * n) % 360
  const g = ((357.528 + 0.9856003 * n) % 360) * (Math.PI / 180)
  const lambda = (L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * (Math.PI / 180)
  const epsilon = (23.439 - 0.0000004 * n) * (Math.PI / 180)
  const sinLambda = Math.sin(lambda)
  const cosLambda = Math.cos(lambda)
  const declination = Math.asin(Math.sin(epsilon) * sinLambda)
  const utHours = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600
  const gmst = (6.697375 + 0.0657098242 * n + utHours) % 24
  const ra = Math.atan2(Math.cos(epsilon) * sinLambda, cosLambda)
  const raDeg = ((ra * 180 / Math.PI) + 360) % 360
  const sunLon = raDeg - gmst * 15
  const sunLat = declination * (180 / Math.PI)
  return { lat: sunLat, lon: ((sunLon + 540) % 360) - 180 }
}
function getSunDirection(date = new Date()) {
  const { lat, lon } = getSunPosition(date)
  return latLonToVec3(lat, lon, 10)
}

// ── Earth shader ─────────────────────────────────────────────
function createEarthMaterial(dayMap, nightMap, bumpMap, specMap, cloudsMap) {
  return new THREE.ShaderMaterial({
    uniforms: {
      dayTexture:   { value: dayMap },
      nightTexture: { value: nightMap },
      bumpTexture:  { value: bumpMap },
      specTexture:  { value: specMap },
      cloudsTexture:{ value: cloudsMap },
      sunDirection: { value: new THREE.Vector3(1, 0, 0) },
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      void main() {
        vUv = uv;
        vNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      uniform sampler2D dayTexture;
      uniform sampler2D nightTexture;
      uniform sampler2D bumpTexture;
      uniform sampler2D specTexture;
      uniform sampler2D cloudsTexture;
      uniform vec3 sunDirection;
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      void main() {
        vec3 sunDir = normalize(sunDirection);
        vec3 normal = normalize(vNormal);
        float NdotL = dot(normal, sunDir);
        float dayFactor = smoothstep(-0.15, 0.25, NdotL);
        vec4 dayColor  = texture2D(dayTexture, vUv);
        vec4 nightColor= texture2D(nightTexture, vUv);
        vec4 clouds    = texture2D(cloudsTexture, vUv);
        vec4 spec      = texture2D(specTexture, vUv);
        vec3 daySide = dayColor.rgb;
        float diffuse = max(NdotL, 0.0);
        daySide *= (0.35 + 0.65 * diffuse);
        daySide = mix(daySide, vec3(0.85), clouds.r * 0.25 * diffuse);
        vec3 viewDir = normalize(cameraPosition - vWorldPosition);
        vec3 halfDir = normalize(sunDir + viewDir);
        float specAngle = max(dot(normal, halfDir), 0.0);
        float specular  = pow(specAngle, 40.0) * spec.r * dayFactor;
        vec3 nightSide = nightColor.rgb * vec3(1.0, 0.85, 0.6) * 1.1;
        nightSide = max(nightSide - clouds.r * 0.3, vec3(0.0));
        vec3 finalColor = mix(nightSide, daySide, dayFactor);
        finalColor += vec3(0.4, 0.4, 0.5) * specular * 0.5;
        finalColor += vec3(0.005, 0.008, 0.015);
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `,
  })
}

// ── Earth mesh ───────────────────────────────────────────────
function Earth({ sunRef }) {
  const earthRef   = useRef()
  const cloudsRef  = useRef()
  const atmosphereRef = useRef()
  const materialRef   = useRef()

  const [earthMap, earthBump, earthSpec, cloudsMap, earthNight] = useLoader(THREE.TextureLoader, [
    'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_atmos_2048.jpg',
    'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_normal_2048.jpg',
    'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_specular_2048.jpg',
    'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_clouds_1024.png',
    'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_lights_2048.png',
  ])

  const earthMaterial = useMemo(() => {
    const mat = createEarthMaterial(earthMap, earthNight, earthBump, earthSpec, cloudsMap)
    materialRef.current = mat
    return mat
  }, [earthMap, earthNight, earthBump, earthSpec, cloudsMap])

  const atmosphereShader = useMemo(() => ({
    uniforms: {
      coefficient: { value: 0.65 },
      power:       { value: 8.0 },
      glowColor:   { value: new THREE.Color('#1a6fa0') },
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vPositionNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPositionNormal = normalize((modelViewMatrix * vec4(position, 1.0)).xyz);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float coefficient;
      uniform float power;
      uniform vec3 glowColor;
      varying vec3 vNormal;
      varying vec3 vPositionNormal;
      void main() {
        float intensity = pow(coefficient + dot(vPositionNormal, vNormal), power);
        gl_FragColor = vec4(glowColor, intensity * 0.3);
      }
    `,
  }), [])

  useFrame(() => {
    const now = new Date()
    const sunPos = getSunDirection(now)
    if (materialRef.current) materialRef.current.uniforms.sunDirection.value.copy(sunPos)
    if (sunRef) sunRef.current = sunPos
    if (cloudsRef.current) cloudsRef.current.rotation.y += 0.00003
  })

  return (
    <group>
      <mesh ref={earthRef} material={earthMaterial}>
        <sphereGeometry args={[2, 128, 128]} />
      </mesh>
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[2.008, 128, 128]} />
        <meshPhongMaterial map={cloudsMap} transparent opacity={0.22} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={atmosphereRef} scale={[1.06, 1.06, 1.06]}>
        <sphereGeometry args={[2, 64, 64]} />
        <shaderMaterial args={[atmosphereShader]} transparent side={THREE.BackSide} depthWrite={false} />
      </mesh>
    </group>
  )
}

// ── Event markers (dots on the globe surface) ────────────────
function EventMarkers({ events, selectedEvent, onSelect }) {
  const RADIUS = 2.02

  const markers = useMemo(() => {
    return events.map(evt => {
      const geo = evt.geometry?.[0] || evt.geometry
      if (!geo?.coordinates) return null
      const coords = Array.isArray(geo.coordinates[0]) ? geo.coordinates[0] : geo.coordinates
      const lon = coords[0]
      const lat = coords[1]
      const catId = evt.categories?.[0]?.id || ''
      const cat = getCat(catId)
      const pos = latLonToVec3(lat, lon, RADIUS)
      const isSelected = selectedEvent?.id === evt.id
      return { id: evt.id, pos, color: cat.color, isSelected, evt }
    }).filter(Boolean)
  }, [events, selectedEvent])

  return (
    <group>
      {markers.map(m => (
        <group key={m.id} position={[m.pos.x, m.pos.y, m.pos.z]}>
          {/* Core dot */}
          <mesh onClick={(e) => { e.stopPropagation(); onSelect(m.evt) }}>
            <sphereGeometry args={[m.isSelected ? 0.04 : 0.025, 12, 12]} />
            <meshBasicMaterial color={m.color} />
          </mesh>
          {/* Ring highlight */}
          {m.isSelected && (
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.05, 0.07, 24]} />
              <meshBasicMaterial color={m.color} transparent opacity={0.55} depthWrite={false} side={THREE.DoubleSide} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  )
}

// ── ISS marker ───────────────────────────────────────────────
function ISSMarker({ iss }) {
  const ringRef = useRef()
  useFrame((_, delta) => { if (ringRef.current) ringRef.current.rotation.z += delta * 2 })

  if (!iss) return null
  const pos = latLonToVec3(iss.position.latitude, iss.position.longitude, 2.06)

  return (
    <group position={[pos.x, pos.y, pos.z]}>
      <mesh>
        <sphereGeometry args={[0.035, 12, 12]} />
        <meshBasicMaterial color="#00ff88" />
      </mesh>
      <mesh ref={ringRef}>
        <ringGeometry args={[0.05, 0.07, 24]} />
        <meshBasicMaterial color="#00ff88" transparent opacity={0.4} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <Html center style={{ pointerEvents: 'none' }}>
        <div style={{
          background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(8px)',
          border: '1px solid rgba(0,255,136,0.3)', borderRadius: '6px',
          padding: '3px 8px', color: '#00ff88', fontSize: '10px',
          fontFamily: 'monospace', whiteSpace: 'nowrap', transform: 'translateY(-24px)',
        }}>
          🏠 ISS {iss.position.latitude.toFixed(1)}°, {iss.position.longitude.toFixed(1)}°
        </div>
      </Html>
    </group>
  )
}

// ── Event floating label ─────────────────────────────────────
function EventLabel({ event }) {
  if (!event) return null
  const geo = event.geometry?.[0] || event.geometry
  if (!geo?.coordinates) return null
  const coords = Array.isArray(geo.coordinates[0]) ? geo.coordinates[0] : geo.coordinates
  const pos = latLonToVec3(coords[1], coords[0], 2.08)
  const cat = getCat(event.categories?.[0]?.id)

  return (
    <Html position={[pos.x, pos.y, pos.z]} center style={{ pointerEvents: 'none' }}>
      <div style={{
        background: 'rgba(15,23,42,0.9)', backdropFilter: 'blur(8px)',
        border: `1px solid ${cat.color}55`, borderRadius: '8px',
        padding: '8px 12px', color: '#e2e8f0', fontSize: '11px',
        fontFamily: 'monospace', whiteSpace: 'nowrap', transform: 'translateY(-36px)',
        maxWidth: '260px', boxShadow: `0 0 12px ${cat.color}22`,
      }}>
        <div style={{ color: cat.color, fontWeight: 700, marginBottom: 3, fontSize: '12px' }}>
          {cat.icon} {event.title}
        </div>
        <div style={{ color: '#94a3b8', fontSize: '10px' }}>
          📍 {coords[1].toFixed(2)}°, {coords[0].toFixed(2)}°
          {geo.date && <span> · 📅 {new Date(geo.date).toLocaleDateString()}</span>}
        </div>
      </div>
    </Html>
  )
}

// ── Sunlight ─────────────────────────────────────────────────
function SunLight({ sunRef }) {
  const lightRef = useRef()
  useFrame(() => { if (lightRef.current && sunRef.current) lightRef.current.position.copy(sunRef.current) })
  return <directionalLight ref={lightRef} position={[5, 3, 5]} intensity={1.4} color="#fff5e6" />
}

// ── Scene ────────────────────────────────────────────────────
function Scene({ events, selectedEvent, onSelectEvent, iss, showISS }) {
  const sunRef = useRef(new THREE.Vector3(5, 3, 5))
  return (
    <>
      <ambientLight intensity={0.02} color="#1a2844" />
      <SunLight sunRef={sunRef} />
      <Stars radius={100} depth={60} count={6000} factor={3} saturation={0.15} fade speed={0.4} />
      <Earth sunRef={sunRef} />
      <EventMarkers events={events} selectedEvent={selectedEvent} onSelect={onSelectEvent} />
      <EventLabel event={selectedEvent} />
      {showISS && <ISSMarker iss={iss} />}
      <OrbitControls
        enablePan={false} minDistance={2.5} maxDistance={15}
        rotateSpeed={0.5} zoomSpeed={0.8} enableDamping dampingFactor={0.05}
        autoRotate autoRotateSpeed={0.15}
      />
    </>
  )
}

// ═══════════════════════════════════════════════════════════════
//  MAIN COMPONENT — Natural Disaster Globe
// ═══════════════════════════════════════════════════════════════
function RealisticGlobe() {
  const [events, setEvents]             = useState([])
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [iss, setIss]                   = useState(null)
  const [loading, setLoading]           = useState(true)
  const [showISS, setShowISS]           = useState(true)
  const [showPanel, setShowPanel]       = useState(true)
  const [searchQuery, setSearchQuery]   = useState('')
  const [activeCategories, setActiveCategories] = useState(Object.keys(EVENT_CATEGORIES))
  const [utcTime, setUtcTime]           = useState('')
  const [sunInfo, setSunInfo]           = useState({ lat: 0, lon: 0 })

  // UTC clock
  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setUtcTime(now.toISOString().slice(11, 19) + ' UTC')
      setSunInfo(getSunPosition(now))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  // Fetch EONET events + ISS on mount
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [evtData, issData] = await Promise.all([fetchNaturalEvents(null, 80), fetchISS()])
      setEvents(evtData || [])
      setIss(issData)
    } catch (err) {
      console.error('Failed to load globe data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // Live ISS poll
  useEffect(() => {
    const id = setInterval(async () => {
      try { const d = await fetchISS(); if (d) setIss(d) } catch {}
    }, 5000)
    return () => clearInterval(id)
  }, [])

  const toggleCategory = (catId) =>
    setActiveCategories(p => p.includes(catId) ? p.filter(c => c !== catId) : [...p, catId])

  // Filter
  const filteredEvents = useMemo(() => {
    let list = events
    if (activeCategories.length < Object.keys(EVENT_CATEGORIES).length)
      list = list.filter(e => activeCategories.includes(e.categories?.[0]?.id || ''))
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      list = list.filter(e => e.title.toLowerCase().includes(q))
    }
    return list
  }, [events, activeCategories, searchQuery])

  // Counts per category
  const categoryCounts = useMemo(() => {
    const c = {}
    events.forEach(e => { const id = e.categories?.[0]?.id || 'unknown'; c[id] = (c[id] || 0) + 1 })
    return c
  }, [events])

  return (
    <div className="cesium-globe-wrapper">
      <Canvas
        camera={{ position: [0, 2, 6], fov: 45, near: 0.1, far: 200 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, background: '#030510' }}
        dpr={[1, 2]}
      >
        <Scene
          events={filteredEvents}
          selectedEvent={selectedEvent}
          onSelectEvent={setSelectedEvent}
          iss={iss}
          showISS={showISS}
        />
      </Canvas>

      {/* ── Overlay UI ──────────────────────────────── */}
      <div className="globe-overlay">

        {/* Top bar */}
        <div className="globe-top-bar">
          <div className="globe-stat-badges">
            <div className="stat-badge">
              <span className="stat-icon">🌍</span>
              <span className="stat-value">{filteredEvents.length}</span>
              <span className="stat-label">Events</span>
            </div>
            <div className="stat-badge">
              <span className="stat-icon">🔥</span>
              <span className="stat-value">{categoryCounts.wildfires || 0}</span>
              <span className="stat-label">Fires</span>
            </div>
            <div className="stat-badge">
              <span className="stat-icon">🌀</span>
              <span className="stat-value">{categoryCounts.severeStorms || 0}</span>
              <span className="stat-label">Storms</span>
            </div>
            <div className="stat-badge live-badge">
              <span className="live-dot"></span>
              <span className="stat-label">LIVE</span>
            </div>
            <div className="stat-badge">
              <span className="stat-icon">🕐</span>
              <span className="stat-value" style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>{utcTime}</span>
            </div>
            <div className="stat-badge">
              <span className="stat-icon">☀️</span>
              <span className="stat-value" style={{ fontSize: '0.65rem', fontFamily: 'monospace' }}>
                {sunInfo.lat.toFixed(1)}°, {sunInfo.lon.toFixed(1)}°
              </span>
              <span className="stat-label">Sub-solar</span>
            </div>
          </div>
        </div>

        {/* Panel toggle */}
        <button className="panel-toggle" onClick={() => setShowPanel(!showPanel)}>
          {showPanel ? '◀' : '▶'}
        </button>

        {/* Side panel */}
        {showPanel && (
          <div className="globe-side-panel">

            {/* Search */}
            <div className="panel-search">
              <input
                type="text" placeholder="Search events…" value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)} className="search-input"
              />
            </div>

            {/* Category filters */}
            <div className="panel-section">
              <h3 className="panel-section-title">Event Categories</h3>
              <div className="group-grid">
                {Object.entries(EVENT_CATEGORIES).map(([id, cat]) => (
                  <button
                    key={id}
                    className={`group-btn ${activeCategories.includes(id) ? 'active' : ''}`}
                    onClick={() => toggleCategory(id)}
                    style={{
                      borderColor: activeCategories.includes(id) ? cat.color : 'transparent',
                      background: activeCategories.includes(id) ? `${cat.color}15` : '',
                    }}
                  >
                    <span className="group-icon">{cat.icon}</span>
                    <span className="group-name">{cat.label}</span>
                    {categoryCounts[id] > 0 && (
                      <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: cat.color, fontWeight: 700 }}>
                        {categoryCounts[id]}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Controls */}
            <div className="panel-section">
              <h3 className="panel-section-title">Controls</h3>
              <div className="controls-grid">
                <label className="control-item">
                  <span>Show ISS</span>
                  <input type="checkbox" checked={showISS} onChange={e => setShowISS(e.target.checked)} className="control-toggle" />
                </label>
                <button className="control-btn" onClick={() => setSelectedEvent(null)}>🏠 Reset View</button>
                <button className="control-btn refresh-btn" onClick={loadData}>🔄 Refresh Data</button>
              </div>
            </div>

            {/* ISS live */}
            {iss && showISS && (
              <div className="panel-section" style={{ borderLeft: '3px solid #00ff88' }}>
                <h3 className="panel-section-title">🏠 ISS Live Position</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Latitude</span>
                    <span className="detail-value" style={{ color: '#00ff88' }}>{iss.position.latitude.toFixed(4)}°</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Longitude</span>
                    <span className="detail-value" style={{ color: '#00ff88' }}>{iss.position.longitude.toFixed(4)}°</span>
                  </div>
                </div>
              </div>
            )}

            {/* Event list */}
            <div className="panel-section satellite-list-section">
              <h3 className="panel-section-title">Active Events ({filteredEvents.length})</h3>
              <div className="satellite-list">
                {filteredEvents.slice(0, 60).map(evt => {
                  const catId = evt.categories?.[0]?.id || ''
                  const cat   = getCat(catId)
                  const isSel = selectedEvent?.id === evt.id
                  return (
                    <button key={evt.id}
                      className={`sat-item ${isSel ? 'selected' : ''}`}
                      onClick={() => setSelectedEvent(evt)}
                      style={isSel ? { borderColor: `${cat.color}55`, background: `${cat.color}10` } : {}}
                    >
                      <span className="sat-icon">{cat.icon}</span>
                      <div className="sat-info">
                        <span className="sat-name">{evt.title}</span>
                        <span className="sat-coords" style={{ color: cat.color }}>{cat.label}</span>
                      </div>
                      <div className="sat-dot" style={{ background: cat.color }} />
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Selected event detail */}
            {selectedEvent && (() => {
              const cat = getCat(selectedEvent.categories?.[0]?.id)
              const geo = selectedEvent.geometry?.[0]
              return (
                <div className="panel-section selected-detail" style={{ borderColor: `${cat.color}30` }}>
                  <h3 className="panel-section-title">{cat.icon} Event Detail</h3>
                  <p style={{ fontSize: '0.82rem', color: '#e2e8f0', fontWeight: 600, marginBottom: 8, lineHeight: 1.4 }}>
                    {selectedEvent.title}
                  </p>
                  <div className="detail-grid">
                    {selectedEvent.categories?.map((c, i) => (
                      <div key={i} className="detail-item">
                        <span className="detail-label">Category</span>
                        <span className="detail-value" style={{ color: getCat(c.id).color }}>{getCat(c.id).label}</span>
                      </div>
                    ))}
                    {geo?.coordinates && (
                      <>
                        <div className="detail-item">
                          <span className="detail-label">Latitude</span>
                          <span className="detail-value">{geo.coordinates[1]?.toFixed(4)}°</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Longitude</span>
                          <span className="detail-value">{geo.coordinates[0]?.toFixed(4)}°</span>
                        </div>
                      </>
                    )}
                    {geo?.date && (
                      <div className="detail-item">
                        <span className="detail-label">Date</span>
                        <span className="detail-value">{new Date(geo.date).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                  {selectedEvent.sources?.map((s, i) => (
                    <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'inline-block', fontSize: '0.72rem', color: '#06b6d4', marginTop: 8, textDecoration: 'none' }}>
                      🔗 Source: {s.id}
                    </a>
                  ))}
                </div>
              )
            })()}
          </div>
        )}

        {loading && (
          <div className="globe-loading">
            <div className="loading-spinner"></div>
            <span>Loading NASA EONET events…</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default RealisticGlobe
