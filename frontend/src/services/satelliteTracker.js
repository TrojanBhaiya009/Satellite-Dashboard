// Satellite Tracking Service
// Uses TLE (Two-Line Element) data to compute real-time satellite positions
// TLE data sourced from CelesTrak (public domain)

const CELESTRAK_BASE = 'https://celestrak.org/NORAD/elements/gp.php'

// Satellite groups available from CelesTrak
export const SATELLITE_GROUPS = {
  ISS: { name: 'ISS (ZARYA)', query: 'CATNR=25544&FORMAT=json', icon: '🏠', color: '#00ff88' },
  STARLINK: { name: 'Starlink', query: 'GROUP=starlink&FORMAT=json', icon: '📡', color: '#6366f1' },
  GPS: { name: 'GPS Satellites', query: 'GROUP=gps-ops&FORMAT=json', icon: '📍', color: '#f59e0b' },
  WEATHER: { name: 'Weather Sats', query: 'GROUP=weather&FORMAT=json', icon: '🌤️', color: '#06b6d4' },
  EARTH_OBSERVATION: { name: 'Earth Observation', query: 'GROUP=resource&FORMAT=json', icon: '🌍', color: '#10b981' },
  SCIENCE: { name: 'Science Sats', query: 'GROUP=science&FORMAT=json', icon: '🔬', color: '#ec4899' },
  GALILEO: { name: 'Galileo', query: 'GROUP=galileo&FORMAT=json', icon: '🇪🇺', color: '#3b82f6' },
  GLONASS: { name: 'GLONASS', query: 'GROUP=glo-ops&FORMAT=json', icon: '🇷🇺', color: '#ef4444' },
}

// Simple SGP4-like orbital propagation (simplified for demo)
// For production, use satellite.js library
function propagateOrbit(tle, timestamp) {
  const { MEAN_MOTION, INCLINATION, RA_OF_ASC_NODE, ECCENTRICITY, ARG_OF_PERICENTER, MEAN_ANOMALY, EPOCH } = tle

  const epochDate = new Date(EPOCH)
  const now = timestamp || new Date()
  const elapsed = (now - epochDate) / 1000 // seconds

  const n = MEAN_MOTION * 2 * Math.PI / 86400 // rad/s
  const M = (MEAN_ANOMALY * Math.PI / 180) + n * elapsed
  const e = ECCENTRICITY
  
  // Solve Kepler's equation (Newton's method)
  let E = M
  for (let i = 0; i < 10; i++) {
    E = E - (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E))
  }

  // True anomaly
  const sinV = Math.sqrt(1 - e * e) * Math.sin(E) / (1 - e * Math.cos(E))
  const cosV = (Math.cos(E) - e) / (1 - e * Math.cos(E))
  const v = Math.atan2(sinV, cosV)

  // Semi-major axis from mean motion (km)
  const mu = 398600.4418 // km^3/s^2
  const a = Math.pow(mu / (n * n), 1 / 3)

  // Radius
  const r = a * (1 - e * Math.cos(E))

  // Position in orbital plane
  const xOrb = r * Math.cos(v)
  const yOrb = r * Math.sin(v)

  // Convert to ECI coordinates
  const i = INCLINATION * Math.PI / 180
  const omega = ARG_OF_PERICENTER * Math.PI / 180
  const RAAN = RA_OF_ASC_NODE * Math.PI / 180

  // Earth rotation
  const gmst = getGMST(now)

  const xECI = xOrb * (Math.cos(omega) * Math.cos(RAAN) - Math.sin(omega) * Math.cos(i) * Math.sin(RAAN))
    - yOrb * (Math.sin(omega) * Math.cos(RAAN) + Math.cos(omega) * Math.cos(i) * Math.sin(RAAN))
  const yECI = xOrb * (Math.cos(omega) * Math.sin(RAAN) + Math.sin(omega) * Math.cos(i) * Math.cos(RAAN))
    - yOrb * (Math.sin(omega) * Math.sin(RAAN) - Math.cos(omega) * Math.cos(i) * Math.cos(RAAN))
  const zECI = xOrb * Math.sin(omega) * Math.sin(i) + yOrb * Math.cos(omega) * Math.sin(i)

  // ECI to ECEF
  const xECEF = xECI * Math.cos(gmst) + yECI * Math.sin(gmst)
  const yECEF = -xECI * Math.sin(gmst) + yECI * Math.cos(gmst)
  const zECEF = zECI

  // ECEF to lat/lon/alt
  const lonRad = Math.atan2(yECEF, xECEF)
  const p = Math.sqrt(xECEF * xECEF + yECEF * yECEF)
  const latRad = Math.atan2(zECEF, p)
  const alt = r - 6371 // Approximate altitude in km

  return {
    latitude: latRad * 180 / Math.PI,
    longitude: lonRad * 180 / Math.PI,
    altitude: Math.max(alt, 100) * 1000, // Convert to meters, minimum 100km
    radius: r
  }
}

function getGMST(date) {
  const JD = date.getTime() / 86400000 + 2440587.5
  const T = (JD - 2451545.0) / 36525.0
  let gmst = 280.46061837 + 360.98564736629 * (JD - 2451545.0) + T * T * (0.000387933 - T / 38710000.0)
  gmst = ((gmst % 360) + 360) % 360
  return gmst * Math.PI / 180
}

// Fetch TLE data from CelesTrak
export const fetchSatelliteGroup = async (groupKey) => {
  const group = SATELLITE_GROUPS[groupKey]
  if (!group) return []

  try {
    const response = await fetch(
      `${CELESTRAK_BASE}?${group.query}`,
      { headers: { 'Accept': 'application/json' } }
    )

    if (!response.ok) throw new Error(`HTTP ${response.status}`)

    const data = await response.json()
    const satellites = Array.isArray(data) ? data : [data]

    return satellites.slice(0, 50).map(sat => {
      const position = propagateOrbit(sat)
      return {
        id: sat.NORAD_CAT_ID,
        name: sat.OBJECT_NAME,
        group: groupKey,
        icon: group.icon,
        color: group.color,
        position,
        tle: sat,
        epoch: sat.EPOCH,
        inclination: sat.INCLINATION,
        period: (1440 / sat.MEAN_MOTION).toFixed(1), // minutes
        apogee: sat.APOAPSIS ? Math.round(sat.APOAPSIS) : null,
        perigee: sat.PERIAPSIS ? Math.round(sat.PERIAPSIS) : null,
      }
    })
  } catch (error) {
    console.error(`Error fetching ${groupKey} satellites:`, error)
    return generateMockSatellites(groupKey, 15)
  }
}

// Update satellite positions in real-time
export const updateSatellitePositions = (satellites, timestamp) => {
  return satellites.map(sat => {
    if (sat.tle && sat.tle.MEAN_MOTION) {
      const position = propagateOrbit(sat.tle, timestamp)
      return { ...sat, position }
    }
    // For mock satellites, simulate movement
    const time = (timestamp || new Date()).getTime() / 1000
    // Hash the id string to get a stable numeric seed
    let hash = 0
    const idStr = String(sat.id)
    for (let i = 0; i < idStr.length; i++) hash = ((hash << 5) - hash) + idStr.charCodeAt(i)
    const seed = Math.abs(hash % 100) + 1
    const speed = 0.002 + seed * 0.001
    const inclRad = (sat.inclination || 45) * Math.PI / 180
    const phase = seed * 0.1
    const orbAngle = (time * speed + phase) % (2 * Math.PI * 100)
    return {
      ...sat,
      position: {
        latitude: Math.sin(orbAngle) * (sat.inclination || 45) * 0.85,
        longitude: ((sat.position.longitude + speed * 0.3) % 360 + 360) % 360 - 180,
        altitude: sat.position.altitude + Math.sin(orbAngle * 2) * 2000
      }
    }
  })
}

// Generate orbit path (future positions)
export const generateOrbitPath = (satellite, points = 200) => {
  if (!satellite.tle || !satellite.tle.MEAN_MOTION) {
    return generateMockOrbitPath(satellite, points)
  }

  const path = []
  const now = new Date()
  const periodMs = (1440 / satellite.tle.MEAN_MOTION) * 60 * 1000 // orbital period in ms

  for (let i = 0; i < points; i++) {
    const t = new Date(now.getTime() + (i / points) * periodMs)
    const pos = propagateOrbit(satellite.tle, t)
    path.push(pos)
  }

  return path
}

function generateMockOrbitPath(satellite, points) {
  const path = []
  const baseLat = satellite.position.latitude
  const baseLon = satellite.position.longitude
  const incl = 45 + (parseInt(satellite.id) % 40)

  for (let i = 0; i < points; i++) {
    const angle = (i / points) * 2 * Math.PI
    path.push({
      latitude: Math.sin(angle) * incl * 0.8,
      longitude: ((baseLon + (i / points) * 360) % 360) - 180,
      altitude: satellite.position.altitude
    })
  }
  return path
}

// Generate mock satellites when API is unavailable
function generateMockSatellites(groupKey, count) {
  const group = SATELLITE_GROUPS[groupKey]
  const names = {
    ISS: ['ISS (ZARYA)'],
    STARLINK: Array.from({ length: count }, (_, i) => `STARLINK-${1000 + i}`),
    GPS: Array.from({ length: count }, (_, i) => `GPS BIIR-${i + 1} (PRN ${i + 1})`),
    WEATHER: ['NOAA 15', 'NOAA 18', 'NOAA 19', 'METOP-A', 'METOP-B', 'METOP-C', 'GOES-16', 'GOES-17', 'GOES-18', 'HIMAWARI-8', 'HIMAWARI-9', 'FENGYUN 3D', 'FENGYUN 3E', 'SUOMI NPP', 'JPSS-1'],
    EARTH_OBSERVATION: ['LANDSAT 8', 'LANDSAT 9', 'SENTINEL-2A', 'SENTINEL-2B', 'TERRA', 'AQUA', 'AURA', 'CALIPSO', 'CLOUDSAT', 'GRACE-FO 1', 'GRACE-FO 2', 'ICESat-2', 'SMAP', 'OCO-2', 'PACE'],
    SCIENCE: ['HUBBLE', 'CHANDRA', 'FERMI', 'SWIFT', 'NUSTAR', 'TESS', 'JWST', 'GAIA', 'PLANCK', 'XMM-NEWTON', 'INTEGRAL', 'SUZAKU', 'ASTROSAT', 'HXMT', 'IXPE'],
    GALILEO: Array.from({ length: count }, (_, i) => `GALILEO-${i + 1}`),
    GLONASS: Array.from({ length: count }, (_, i) => `GLONASS-${700 + i}`),
  }

  const altitudes = {
    ISS: 420000, STARLINK: 550000, GPS: 20200000, WEATHER: 800000,
    EARTH_OBSERVATION: 700000, SCIENCE: 600000, GALILEO: 23222000, GLONASS: 19100000
  }

  const satNames = names[groupKey] || Array.from({ length: count }, (_, i) => `SAT-${i}`)

  return satNames.slice(0, count).map((name, idx) => ({
    id: `${groupKey}-${idx}`,
    name,
    group: groupKey,
    icon: group.icon,
    color: group.color,
    position: {
      latitude: (Math.random() - 0.5) * 140,
      longitude: (Math.random() - 0.5) * 360,
      altitude: altitudes[groupKey] + (Math.random() - 0.5) * 100000
    },
    tle: null,
    inclination: 30 + Math.random() * 70,
    period: groupKey === 'GPS' ? '718' : groupKey === 'ISS' ? '92.5' : (90 + Math.random() * 100).toFixed(1),
    apogee: Math.round((altitudes[groupKey] / 1000) + 20),
    perigee: Math.round((altitudes[groupKey] / 1000) - 20),
  }))
}

// Fetch ISS specifically (always available)
export const fetchISS = async () => {
  try {
    const response = await fetch('http://api.open-notify.org/iss-now.json')
    const data = await response.json()
    if (data.message === 'success') {
      return {
        id: '25544',
        name: 'ISS (ZARYA)',
        group: 'ISS',
        icon: '🏠',
        color: '#00ff88',
        position: {
          latitude: parseFloat(data.iss_position.latitude),
          longitude: parseFloat(data.iss_position.longitude),
          altitude: 420000
        },
        tle: null,
        inclination: 51.6,
        period: '92.5',
        apogee: 422,
        perigee: 418
      }
    }
  } catch (error) {
    console.error('Error fetching ISS position:', error)
  }
  return null
}
