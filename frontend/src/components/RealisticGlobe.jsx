import { useRef, useMemo, useState, useEffect, useCallback } from 'react'
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber'
import { OrbitControls, Stars, Html } from '@react-three/drei'
import * as THREE from 'three'
import {
  SATELLITE_GROUPS,
  fetchSatelliteGroup,
  fetchISS,
  updateSatellitePositions,
  generateOrbitPath
} from '../services/satelliteTracker'

// Convert lat/lon/alt to 3D position on sphere
function latLonToVec3(lat, lon, radius) {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lon + 180) * (Math.PI / 180)
  const x = -radius * Math.sin(phi) * Math.cos(theta)
  const y = radius * Math.cos(phi)
  const z = radius * Math.sin(phi) * Math.sin(theta)
  return new THREE.Vector3(x, y, z)
}

// ============================================
// Real-time Sun Position Calculator
// Computes where the sun is (lat/lon) based on current UTC time
// ============================================
function getSunPosition(date = new Date()) {
  const jd = date.getTime() / 86400000 + 2440587.5
  const n = jd - 2451545.0 // days since J2000.0

  // Mean longitude & mean anomaly of the sun
  const L = (280.460 + 0.9856474 * n) % 360
  const g = ((357.528 + 0.9856003 * n) % 360) * (Math.PI / 180)

  // Ecliptic longitude
  const lambda = (L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * (Math.PI / 180)

  // Obliquity of the ecliptic
  const epsilon = (23.439 - 0.0000004 * n) * (Math.PI / 180)

  // Right ascension and declination
  const sinLambda = Math.sin(lambda)
  const cosLambda = Math.cos(lambda)
  const sinEpsilon = Math.sin(epsilon)
  const cosEpsilon = Math.cos(epsilon)

  const declination = Math.asin(sinEpsilon * sinLambda) // radians

  // Greenwich Mean Sidereal Time (hours)
  const utHours = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600
  const gmst = (6.697375 + 0.0657098242 * n + utHours) % 24

  // Sub-solar point
  const ra = Math.atan2(cosEpsilon * sinLambda, cosLambda) // radians
  const raDeg = ((ra * 180 / Math.PI) + 360) % 360
  const sunLon = raDeg - gmst * 15 // degrees
  const sunLat = declination * (180 / Math.PI) // degrees

  return { lat: sunLat, lon: ((sunLon + 540) % 360) - 180 }
}

// Convert sun lat/lon to a 3D direction vector (used for light position)
function getSunDirection(date = new Date()) {
  const { lat, lon } = getSunPosition(date)
  const pos = latLonToVec3(lat, lon, 10)
  return pos
}

// ============================================
// Day/Night Earth Shader Material
// Blends day map and night lights based on real sun position
// ============================================
function createEarthMaterial(dayMap, nightMap, bumpMap, specMap, cloudsMap) {
  return new THREE.ShaderMaterial({
    uniforms: {
      dayTexture: { value: dayMap },
      nightTexture: { value: nightMap },
      bumpTexture: { value: bumpMap },
      specTexture: { value: specMap },
      cloudsTexture: { value: cloudsMap },
      sunDirection: { value: new THREE.Vector3(1, 0, 0) },
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      void main() {
        vUv = uv;
        // Transform normal to WORLD space (not view space) so it matches the world-space sun direction
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

        // Cosine of angle between surface normal and sun direction
        float NdotL = dot(normal, sunDir);

        // Smooth transition across terminator (twilight zone)
        // -0.1 to 0.2 range gives a realistic twilight band
        float dayFactor = smoothstep(-0.15, 0.25, NdotL);

        // Sample textures
        vec4 dayColor = texture2D(dayTexture, vUv);
        vec4 nightColor = texture2D(nightTexture, vUv);
        vec4 clouds = texture2D(cloudsTexture, vUv);
        vec4 spec = texture2D(specTexture, vUv);

        // Day side: full color with clouds
        vec3 daySide = dayColor.rgb;
        // Add subtle diffuse shading on day side
        float diffuse = max(NdotL, 0.0);
        daySide *= (0.35 + 0.65 * diffuse);
        // Add clouds on day side (brighter in sunlight)
        daySide = mix(daySide, vec3(1.0), clouds.r * 0.4 * diffuse);

        // Specular highlight on water (where specular map is bright)
        vec3 viewDir = normalize(cameraPosition - vWorldPosition);
        vec3 halfDir = normalize(sunDir + viewDir);
        float specAngle = max(dot(normal, halfDir), 0.0);
        float specular = pow(specAngle, 40.0) * spec.r * dayFactor;

        // Night side: city lights glow with warm orange tint
        vec3 nightSide = nightColor.rgb * vec3(1.0, 0.85, 0.6) * 1.5;
        // Dim clouds on night side
        nightSide = max(nightSide - clouds.r * 0.3, vec3(0.0));

        // Blend between day and night
        vec3 finalColor = mix(nightSide, daySide, dayFactor);

        // Add specular on top
        finalColor += vec3(0.6, 0.6, 0.7) * specular * 0.8;

        // Subtle ambient so dark side isn't pure black
        finalColor += vec3(0.005, 0.008, 0.015);

        gl_FragColor = vec4(finalColor, 1.0);
      }
    `,
  })
}

// ============================================
// Earth Globe Mesh — Real-time day/night
// ============================================
function Earth({ sunRef }) {
  const earthRef = useRef()
  const cloudsRef = useRef()
  const atmosphereRef = useRef()
  const materialRef = useRef()

  // Load textures
  const [earthMap, earthBump, earthSpec, cloudsMap, earthNight] = useLoader(THREE.TextureLoader, [
    'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_atmos_2048.jpg',
    'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_normal_2048.jpg',
    'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_specular_2048.jpg',
    'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_clouds_1024.png',
    'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_lights_2048.png',
  ])

  // Create custom day/night shader material
  const earthMaterial = useMemo(() => {
    const mat = createEarthMaterial(earthMap, earthNight, earthBump, earthSpec, cloudsMap)
    materialRef.current = mat
    return mat
  }, [earthMap, earthNight, earthBump, earthSpec, cloudsMap])

  // Atmosphere glow shader
  const atmosphereShader = useMemo(() => ({
    uniforms: {
      coefficient: { value: 0.8 },
      power: { value: 6.0 },
      glowColor: { value: new THREE.Color('#4facfe') },
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
        gl_FragColor = vec4(glowColor, intensity * 0.65);
      }
    `,
  }), [])

  // Update sun direction every frame based on real time
  useFrame(() => {
    const now = new Date()
    const sunPos = getSunDirection(now)

    // Update the shader uniform with new sun direction
    if (materialRef.current) {
      materialRef.current.uniforms.sunDirection.value.copy(sunPos)
    }

    // Share sun position with parent for the directional light
    if (sunRef) {
      sunRef.current = sunPos
    }

    // Gentle cloud drift (clouds move independently)
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += 0.00003
    }
  })

  return (
    <group>
      {/* Earth with day/night shader — NO rotation since we track real-time sun */}
      <mesh ref={earthRef} material={earthMaterial}>
        <sphereGeometry args={[2, 128, 128]} />
      </mesh>

      {/* Cloud layer (slightly transparent, lit only on day side) */}
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[2.008, 128, 128]} />
        <meshPhongMaterial
          map={cloudsMap}
          transparent
          opacity={0.22}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Atmosphere glow */}
      <mesh ref={atmosphereRef} scale={[1.12, 1.12, 1.12]}>
        <sphereGeometry args={[2, 64, 64]} />
        <shaderMaterial
          args={[atmosphereShader]}
          transparent
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}

// ============================================
// Enhanced Satellite Points with Halos
// ============================================
function SatellitePoints({ satellites, selectedSat, onSelect }) {
  const EARTH_RADIUS = 2
  const SCALE = EARTH_RADIUS / 6371 // km to scene units

  const { points, colors, sizes, halos } = useMemo(() => {
    const pts = []
    const cols = []
    const szs = []
    const haloGeoms = []

    satellites.forEach(sat => {
      const altKm = sat.position.altitude / 1000
      const r = EARTH_RADIUS + altKm * SCALE
      const pos = latLonToVec3(sat.position.latitude, sat.position.longitude, r)
      pts.push(pos.x, pos.y, pos.z)

      const col = new THREE.Color(sat.color)
      cols.push(col.r, col.g, col.b)

      const isSelected = selectedSat?.id === sat.id
      // Much larger sizes: 12-16 for selected, 6-8 for normal satellites
      szs.push(isSelected ? 16 : 8)
      
      // Store position for halo rings
      haloGeoms.push({ pos, color: col, isSelected })
    })

    return {
      points: new Float32Array(pts),
      colors: new Float32Array(cols),
      sizes: new Float32Array(szs),
      halos: haloGeoms,
    }
  }, [satellites, selectedSat, EARTH_RADIUS, SCALE])

  // Enhanced shader with brighter glow
  const shaderMaterial = useMemo(() => new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 } },
    vertexShader: `
      attribute float size;
      attribute vec3 customColor;
      varying vec3 vColor;
      void main() {
        vColor = customColor;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * (400.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      void main() {
        float d = length(gl_PointCoord - vec2(0.5));
        if (d > 0.5) discard;
        
        // Intense core
        float core = smoothstep(0.25, 0.0, d);
        // Wide soft glow
        float glow = 1.2 * (1.0 - smoothstep(0.0, 0.5, d));
        
        vec3 color = vColor * (glow * 0.8 + core * 1.2);
        float alpha = (glow + core) * 0.95;
        gl_FragColor = vec4(color, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }), [])

  if (satellites.length === 0) return null

  return (
    <group>
      {/* Main satellite points */}
      <points material={shaderMaterial}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={satellites.length}
            array={points}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-customColor"
            count={satellites.length}
            array={colors}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-size"
            count={satellites.length}
            array={sizes}
            itemSize={1}
          />
        </bufferGeometry>
      </points>

      {/* Halo rings around satellites for extra visibility */}
      {halos.map((halo, i) => (
        <mesh key={`halo-${i}`} position={[halo.pos.x, halo.pos.y, halo.pos.z]}>
          <ringGeometry args={[0.08, 0.14, 32]} />
          <meshBasicMaterial
            color={halo.color}
            transparent
            opacity={halo.isSelected ? 0.8 : 0.4}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  )
}

// ============================================
// Enhanced Orbit Lines with Better Visibility
// ============================================
function OrbitLines({ satellites, selectedSat, showOrbits }) {
  const EARTH_RADIUS = 2
  const SCALE = EARTH_RADIUS / 6371

  const lines = useMemo(() => {
    if (!showOrbits) return []

    // Show more satellites' orbits (up to 50) for better orbital visualization
    return satellites.slice(0, 50).map(sat => {
      const path = generateOrbitPath(sat, 300) // More points for smoother curves
      if (!path || path.length < 2) return null

      const positions = path.map(p => {
        const altKm = p.altitude / 1000
        const r = EARTH_RADIUS + altKm * SCALE
        return latLonToVec3(p.latitude, p.longitude, r)
      })

      const geometry = new THREE.BufferGeometry().setFromPoints(positions)
      const color = new THREE.Color(sat.color)
      const isSelected = selectedSat?.id === sat.id

      return { 
        geometry, 
        color, 
        // Much brighter and thicker orbits
        opacity: isSelected ? 0.9 : 0.35,
        width: isSelected ? 3 : 1.5,
        id: sat.id 
      }
    }).filter(Boolean)
  }, [satellites.length, selectedSat, showOrbits])

  return (
    <>
      {lines.map(line => (
        <line key={line.id} geometry={line.geometry}>
          <lineBasicMaterial
            color={line.color}
            transparent
            opacity={line.opacity}
            linewidth={line.width}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </line>
      ))}
    </>
  )
}

// ============================================
// Selected satellite label (HTML overlay)
// ============================================
function SatelliteLabel({ satellite }) {
  const EARTH_RADIUS = 2
  const SCALE = EARTH_RADIUS / 6371

  if (!satellite) return null

  const altKm = satellite.position.altitude / 1000
  const r = EARTH_RADIUS + altKm * SCALE + 0.08
  const pos = latLonToVec3(satellite.position.latitude, satellite.position.longitude, r)

  return (
    <Html position={[pos.x, pos.y, pos.z]} center style={{ pointerEvents: 'none' }}>
      <div style={{
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(8px)',
        border: `1px solid ${satellite.color}55`,
        borderRadius: '8px',
        padding: '6px 12px',
        color: '#e2e8f0',
        fontSize: '11px',
        fontFamily: 'monospace',
        whiteSpace: 'nowrap',
        transform: 'translateY(-30px)',
        boxShadow: `0 0 20px ${satellite.color}33`,
      }}>
        <div style={{ color: satellite.color, fontWeight: 700, marginBottom: 2 }}>
          {satellite.icon} {satellite.name}
        </div>
        <div style={{ color: '#94a3b8', fontSize: '10px' }}>
          {satellite.position.latitude.toFixed(2)}°, {satellite.position.longitude.toFixed(2)}° | {(satellite.position.altitude / 1000).toFixed(0)} km
        </div>
      </div>
    </Html>
  )
}

// ============================================
// Scene Setup — with real-time sun tracking
// ============================================
function SunLight({ sunRef }) {
  const lightRef = useRef()
  
  useFrame(() => {
    if (lightRef.current && sunRef.current) {
      lightRef.current.position.copy(sunRef.current)
    }
  })

  return (
    <directionalLight
      ref={lightRef}
      position={[5, 3, 5]}
      intensity={2.0}
      color="#fff5e6"
    />
  )
}

function Scene({ satellites, selectedSat, onSelect, showOrbits }) {
  const sunRef = useRef(new THREE.Vector3(5, 3, 5))

  return (
    <>
      {/* Lighting — sun tracks real position */}
      <ambientLight intensity={0.03} color="#223355" />
      <SunLight sunRef={sunRef} />

      {/* Stars background */}
      <Stars radius={100} depth={60} count={8000} factor={5} saturation={0.2} fade speed={0.5} />

      {/* Earth — receives sun ref for shader */}
      <Earth sunRef={sunRef} />

      {/* Satellites */}
      <SatellitePoints satellites={satellites} selectedSat={selectedSat} onSelect={onSelect} />
      <OrbitLines satellites={satellites} selectedSat={selectedSat} showOrbits={showOrbits} />
      <SatelliteLabel satellite={selectedSat} />

      {/* Camera Controls */}
      <OrbitControls
        enablePan={false}
        minDistance={2.5}
        maxDistance={15}
        rotateSpeed={0.5}
        zoomSpeed={0.8}
        enableDamping
        dampingFactor={0.05}
        autoRotate
        autoRotateSpeed={0.15}
      />
    </>
  )
}

// ============================================
// Main Globe Component
// ============================================
function RealisticGlobe() {
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
  const [utcTime, setUtcTime] = useState('')
  const [sunInfo, setSunInfo] = useState({ lat: 0, lon: 0 })
  const satellitesRef = useRef([])

  // Real-time UTC clock
  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setUtcTime(now.toISOString().slice(11, 19) + ' UTC')
      const sun = getSunPosition(now)
      setSunInfo(sun)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  // Load satellites
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

  useEffect(() => { loadSatellites() }, [loadSatellites])

  // Real-time position updates
  useEffect(() => {
    if (satellites.length === 0) return
    const interval = setInterval(() => {
      setSatellites(prev => {
        const updated = updateSatellitePositions(prev, new Date())
        satellitesRef.current = updated
        return updated
      })
    }, 1000 / clockSpeed)
    return () => clearInterval(interval)
  }, [satellites.length, clockSpeed])

  const toggleGroup = (groupKey) => {
    setActiveGroups(prev =>
      prev.includes(groupKey)
        ? prev.filter(g => g !== groupKey)
        : [...prev, groupKey]
    )
  }

  const flyToSatellite = (sat) => {
    setSelectedSat(sat)
  }

  const resetView = () => {
    setSelectedSat(null)
  }

  const filteredSatellites = searchQuery
    ? satellites.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : satellites

  return (
    <div className="cesium-globe-wrapper">
      {/* Three.js Canvas */}
      <Canvas
        camera={{ position: [0, 2, 6], fov: 45, near: 0.1, far: 200 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, background: '#030510' }}
        dpr={[1, 2]}
      >
        <Scene
          satellites={filteredSatellites}
          selectedSat={selectedSat}
          onSelect={flyToSatellite}
          showOrbits={showOrbits}
        />
      </Canvas>

      {/* UI Overlay */}
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
            <div className="stat-badge">
              <span className="stat-icon">🕐</span>
              <span className="stat-value" style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>{utcTime}</span>
            </div>
            <div className="stat-badge">
              <span className="stat-icon">☀️</span>
              <span className="stat-value" style={{ fontSize: '0.65rem', fontFamily: 'monospace' }}>{sunInfo.lat.toFixed(1)}°, {sunInfo.lon.toFixed(1)}°</span>
              <span className="stat-label">Sub-solar</span>
            </div>
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

export default RealisticGlobe
