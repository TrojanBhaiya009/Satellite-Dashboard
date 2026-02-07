import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useUser } from '@clerk/clerk-react'
import { fetchNaturalEvents, fetchClimateData } from '../services/satelliteApi'
import { fetchISS, SATELLITE_GROUPS, fetchSatelliteGroup } from '../services/satelliteTracker'
import '../styles/MissionControl.css'

// ─── Animated Counter ───────────────────────────────────────
function AnimatedNumber({ target, duration = 2000, prefix = '', suffix = '', decimals = 0 }) {
  const [value, setValue] = useState(0)
  const startTime = useRef(null)
  const rafId = useRef(null)

  useEffect(() => {
    startTime.current = performance.now()
    const animate = (now) => {
      const elapsed = now - startTime.current
      const progress = Math.min(elapsed / duration, 1)
      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
      setValue(eased * target)
      if (progress < 1) rafId.current = requestAnimationFrame(animate)
    }
    rafId.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafId.current)
  }, [target, duration])

  return <span>{prefix}{value.toFixed(decimals)}{suffix}</span>
}

// ─── Live Clock ─────────────────────────────────────────────
function MissionClock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const utc = now.toISOString().replace('T', '  ').slice(0, 21)
  const met = `T+ ${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')}:${String(now.getUTCSeconds()).padStart(2, '0')}`

  return (
    <div className="mc-clock">
      <div className="mc-clock-utc">
        <span className="mc-clock-label">UTC</span>
        <span className="mc-clock-time">{utc}</span>
      </div>
      <div className="mc-clock-met">
        <span className="mc-clock-label">MET</span>
        <span className="mc-clock-time mc-clock-green">{met}</span>
      </div>
    </div>
  )
}

// ─── Threat Level Ring ──────────────────────────────────────
function ThreatRing({ level, label }) {
  const colors = {
    LOW: { stroke: '#10b981', bg: 'rgba(16,185,129,0.1)', text: '#10b981' },
    MODERATE: { stroke: '#f59e0b', bg: 'rgba(245,158,11,0.1)', text: '#f59e0b' },
    HIGH: { stroke: '#f97316', bg: 'rgba(249,115,22,0.1)', text: '#f97316' },
    CRITICAL: { stroke: '#ef4444', bg: 'rgba(239,68,68,0.15)', text: '#ef4444' },
  }
  const c = colors[level] || colors.LOW
  const pct = level === 'LOW' ? 25 : level === 'MODERATE' ? 50 : level === 'HIGH' ? 75 : 95
  const circumference = 2 * Math.PI * 42
  const offset = circumference - (pct / 100) * circumference

  return (
    <div className="mc-threat-ring" style={{ background: c.bg }}>
      <svg viewBox="0 0 100 100" className="mc-threat-svg">
        <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
        <circle
          cx="50" cy="50" r="42" fill="none"
          stroke={c.stroke} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          className="mc-threat-arc"
        />
      </svg>
      <div className="mc-threat-center">
        <span className="mc-threat-level" style={{ color: c.text }}>{level}</span>
        <span className="mc-threat-label">{label}</span>
      </div>
    </div>
  )
}

// ─── Sparkline Mini Chart ───────────────────────────────────
function Sparkline({ data, color = '#06b6d4', height = 40, width = 120 }) {
  if (!data || data.length === 0) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((v - min) / range) * (height - 4) - 2
    return `${x},${y}`
  }).join(' ')

  return (
    <svg width={width} height={height} className="mc-sparkline">
      <defs>
        <linearGradient id={`spark-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round"
        points={points}
      />
      <polygon
        fill={`url(#spark-${color.replace('#', '')})`}
        points={`0,${height} ${points} ${width},${height}`}
      />
    </svg>
  )
}

// ─── Event Severity Badge ───────────────────────────────────
function SeverityBadge({ category }) {
  const map = {
    wildfires: { label: 'FIRE', color: '#ef4444', icon: '🔥' },
    severeStorms: { label: 'STORM', color: '#8b5cf6', icon: '🌀' },
    volcanoes: { label: 'VOLCANO', color: '#f97316', icon: '🌋' },
    floods: { label: 'FLOOD', color: '#3b82f6', icon: '🌊' },
    earthquakes: { label: 'QUAKE', color: '#eab308', icon: '⚡' },
    landslides: { label: 'SLIDE', color: '#a3622a', icon: '⛰️' },
    seaLakeIce: { label: 'ICE', color: '#06b6d4', icon: '❄️' },
    snow: { label: 'SNOW', color: '#e2e8f0', icon: '🌨️' },
    drought: { label: 'DROUGHT', color: '#d97706', icon: '☀️' },
  }
  const info = map[category] || { label: 'EVENT', color: '#94a3b8', icon: '📡' }
  return (
    <span className="mc-severity-badge" style={{ background: `${info.color}22`, color: info.color, borderColor: `${info.color}55` }}>
      {info.icon} {info.label}
    </span>
  )
}

// ─── Satellite Subsystem Status ─────────────────────────────
function SubsystemStatus({ label, status, value }) {
  const colorMap = { nominal: '#10b981', warning: '#f59e0b', critical: '#ef4444', offline: '#64748b' }
  const color = colorMap[status] || colorMap.nominal
  return (
    <div className="mc-subsystem">
      <div className="mc-subsystem-indicator" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
      <div className="mc-subsystem-info">
        <span className="mc-subsystem-label">{label}</span>
        <span className="mc-subsystem-value" style={{ color }}>{value || status.toUpperCase()}</span>
      </div>
    </div>
  )
}

// ─── Mini World Map with events ─────────────────────────────
function EventWorldMap({ events }) {
  return (
    <div className="mc-worldmap-container">
      <svg viewBox="-180 -90 360 180" className="mc-worldmap-svg" preserveAspectRatio="xMidYMid meet">
        {/* Grid lines */}
        {[-60, -30, 0, 30, 60].map(lat => (
          <line key={`lat${lat}`} x1="-180" y1={-lat} x2="180" y2={-lat} stroke="rgba(6,182,212,0.08)" strokeWidth="0.5" />
        ))}
        {[-120, -60, 0, 60, 120].map(lon => (
          <line key={`lon${lon}`} x1={lon} y1="-90" x2={lon} y2="90" stroke="rgba(6,182,212,0.08)" strokeWidth="0.5" />
        ))}
        {/* Simplified continent outlines */}
        {/* North America */}
        <polygon points="-130,-10 -60,-10 -60,10 -80,30 -55,50 -75,72 -170,72 -170,50 -130,30" fill="rgba(6,182,212,0.08)" stroke="rgba(6,182,212,0.2)" strokeWidth="0.5" />
        {/* South America */}
        <polygon points="-80,-55 -35,-10 -35,5 -50,10 -80,10 -80,-10 -70,-30" fill="rgba(6,182,212,0.08)" stroke="rgba(6,182,212,0.2)" strokeWidth="0.5" />
        {/* Europe */}
        <polygon points="-10,35 40,35 45,50 35,60 50,72 -10,72 -10,50" fill="rgba(6,182,212,0.08)" stroke="rgba(6,182,212,0.2)" strokeWidth="0.5" />
        {/* Africa */}
        <polygon points="-18,35 52,35 50,0 30,-35 15,-35 5,-5 -18,5" fill="rgba(6,182,212,0.08)" stroke="rgba(6,182,212,0.2)" strokeWidth="0.5" />
        {/* Asia */}
        <polygon points="40,35 45,50 55,55 70,45 80,30 100,35 130,45 145,55 180,72 50,72 35,60" fill="rgba(6,182,212,0.08)" stroke="rgba(6,182,212,0.2)" strokeWidth="0.5" />
        {/* Australia */}
        <polygon points="115,-10 150,-10 155,-25 145,-40 115,-35 112,-25" fill="rgba(6,182,212,0.08)" stroke="rgba(6,182,212,0.2)" strokeWidth="0.5" />

        {/* Event markers */}
        {events.map((evt, i) => {
          const geo = evt.geometry?.[0] || evt.geometry
          if (!geo?.coordinates) return null
          const coords = Array.isArray(geo.coordinates[0]) ? geo.coordinates[0] : geo.coordinates
          const lon = coords[0]
          const lat = -coords[1] // SVG y is inverted

          const catId = evt.categories?.[0]?.id || ''
          const colorMap = {
            wildfires: '#ef4444', severeStorms: '#8b5cf6', volcanoes: '#f97316',
            floods: '#3b82f6', seaLakeIce: '#06b6d4', snow: '#e2e8f0',
          }
          const color = colorMap[catId] || '#f59e0b'

          return (
            <g key={i}>
              <circle cx={lon} cy={lat} r="3" fill={color} opacity="0.3" className="mc-map-pulse" />
              <circle cx={lon} cy={lat} r="1.5" fill={color} opacity="0.9" />
            </g>
          )
        })}
      </svg>
    </div>
  )
}


// ═══════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
function MissionControl() {
  const { user } = useUser()
  const [events, setEvents] = useState([])
  const [iss, setIss] = useState(null)
  const [constellationCounts, setConstellationCounts] = useState({})
  const [climateData, setClimateData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [alertFeed, setAlertFeed] = useState([])
  const [selectedEvent, setSelectedEvent] = useState(null)
  const feedRef = useRef(null)

  // Telemetry sparkline data (simulated real-time)
  const [telemetry, setTelemetry] = useState({
    signalStrength: Array.from({ length: 30 }, () => 85 + Math.random() * 15),
    dataRate: Array.from({ length: 30 }, () => 200 + Math.random() * 100),
    temperature: Array.from({ length: 30 }, () => 18 + Math.random() * 8),
    power: Array.from({ length: 30 }, () => 90 + Math.random() * 10),
  })

  // Load all data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const [eventsData, issData] = await Promise.all([
          fetchNaturalEvents(null, 50),
          fetchISS(),
        ])

        setEvents(eventsData)
        setIss(issData)

        // Build alert feed from events
        const feed = eventsData.slice(0, 20).map((e, i) => ({
          id: i,
          time: new Date(e.geometry?.[0]?.date || e.geometry?.date || Date.now()).toLocaleTimeString(),
          title: e.title,
          category: e.categories?.[0]?.id || 'unknown',
          severity: i < 3 ? 'critical' : i < 8 ? 'warning' : 'info'
        }))
        setAlertFeed(feed)

        // Count satellite constellations 
        const groups = ['ISS', 'STARLINK', 'GPS', 'WEATHER', 'EARTH_OBSERVATION']
        const counts = {}
        for (const g of groups) {
          try {
            const sats = await fetchSatelliteGroup(g)
            counts[g] = sats.length
          } catch { counts[g] = 0 }
        }
        setConstellationCounts(counts)

        // Fetch climate data for a demo location (New York)
        const today = new Date()
        const weekAgo = new Date(today.getTime() - 7 * 86400000)
        const fmt = d => d.toISOString().slice(0, 10).replace(/-/g, '')
        const climate = await fetchClimateData(40.7, -74.0, fmt(weekAgo), fmt(today))
        setClimateData(climate)

      } catch (err) {
        console.error('Mission Control data load error:', err)
      }
      setLoading(false)
    }
    loadData()
  }, [])

  // Live ISS updates
  useEffect(() => {
    const id = setInterval(async () => {
      const data = await fetchISS()
      if (data) setIss(data)
    }, 5000)
    return () => clearInterval(id)
  }, [])

  // Live telemetry simulation
  useEffect(() => {
    const id = setInterval(() => {
      setTelemetry(prev => ({
        signalStrength: [...prev.signalStrength.slice(1), 85 + Math.random() * 15],
        dataRate: [...prev.dataRate.slice(1), 200 + Math.random() * 100],
        temperature: [...prev.temperature.slice(1), 18 + Math.random() * 8],
        power: [...prev.power.slice(1), 90 + Math.random() * 10],
      }))
    }, 2000)
    return () => clearInterval(id)
  }, [])

  // Derived stats
  const fireCount = events.filter(e => e.categories?.some(c => c.id === 'wildfires')).length
  const stormCount = events.filter(e => e.categories?.some(c => c.id === 'severeStorms')).length
  const totalSats = Object.values(constellationCounts).reduce((a, b) => a + b, 0)
  const threatLevel = fireCount > 10 ? 'CRITICAL' : fireCount > 5 ? 'HIGH' : stormCount > 3 ? 'MODERATE' : 'LOW'

  // Climate sparklines
  const tempData = climateData?.T2M ? Object.values(climateData.T2M).slice(-7) : [20, 22, 19, 21, 23, 20, 22]
  const humidityData = climateData?.RH2M ? Object.values(climateData.RH2M).slice(-7) : [65, 70, 68, 72, 67, 71, 69]
  const solarData = climateData?.ALLSKY_SFC_SW_DWN ? Object.values(climateData.ALLSKY_SFC_SW_DWN).slice(-7) : [4.5, 5.2, 3.8, 6.1, 5.5, 4.9, 5.8]

  if (loading) {
    return (
      <div className="mc-loading">
        <div className="mc-loading-ring" />
        <p className="mc-loading-text">Initializing Mission Control...</p>
        <p className="mc-loading-sub">Connecting to satellite networks</p>
      </div>
    )
  }

  return (
    <div className="mc-root">
      {/* ── TOP BAR ── */}
      <header className="mc-header">
        <div className="mc-header-left">
          <div className="mc-header-status">
            <span className="mc-status-dot mc-status-dot--live" />
            <span className="mc-status-text">LIVE</span>
          </div>
          <h1 className="mc-title">🚀 MISSION CONTROL</h1>
          <span className="mc-subtitle">SatelliteFusion • Real-Time Earth Intelligence</span>
        </div>
        <MissionClock />
      </header>

      <div className="mc-body">
        {/* ── LEFT COLUMN ── */}
        <aside className="mc-col mc-col--left">
          {/* Threat Assessment */}
          <section className="mc-card mc-card--threat">
            <h2 className="mc-card-title">⚠️ THREAT ASSESSMENT</h2>
            <ThreatRing level={threatLevel} label="Global Risk" />
            <div className="mc-threat-stats">
              <div className="mc-threat-stat">
                <span className="mc-threat-stat-val" style={{ color: '#ef4444' }}>{fireCount}</span>
                <span className="mc-threat-stat-lbl">🔥 Active Fires</span>
              </div>
              <div className="mc-threat-stat">
                <span className="mc-threat-stat-val" style={{ color: '#8b5cf6' }}>{stormCount}</span>
                <span className="mc-threat-stat-lbl">🌀 Storms</span>
              </div>
              <div className="mc-threat-stat">
                <span className="mc-threat-stat-val" style={{ color: '#f59e0b' }}>{events.length}</span>
                <span className="mc-threat-stat-lbl">📡 Total Events</span>
              </div>
            </div>
          </section>

          {/* Satellite Constellations */}
          <section className="mc-card">
            <h2 className="mc-card-title">🛰️ CONSTELLATION STATUS</h2>
            <div className="mc-constellation-grid">
              {Object.entries(SATELLITE_GROUPS).slice(0, 6).map(([key, g]) => (
                <div key={key} className="mc-constellation-item">
                  <span className="mc-constellation-icon">{g.icon}</span>
                  <span className="mc-constellation-name">{g.name.split(' ')[0]}</span>
                  <span className="mc-constellation-count" style={{ color: g.color }}>
                    {constellationCounts[key] || '—'}
                  </span>
                </div>
              ))}
            </div>
            <div className="mc-total-sats">
              <span>Total Tracked</span>
              <span className="mc-total-sats-num"><AnimatedNumber target={totalSats} /></span>
            </div>
          </section>

          {/* Subsystem Status */}
          <section className="mc-card">
            <h2 className="mc-card-title">🔧 SUBSYSTEM STATUS</h2>
            <div className="mc-subsystem-list">
              <SubsystemStatus label="Comm Link" status="nominal" value="NOMINAL" />
              <SubsystemStatus label="Data Pipeline" status="nominal" value="ACTIVE" />
              <SubsystemStatus label="STAC API" status="nominal" value="CONNECTED" />
              <SubsystemStatus label="NASA EONET" status="nominal" value={`${events.length} EVENTS`} />
              <SubsystemStatus label="ISS Tracker" status={iss ? 'nominal' : 'warning'} value={iss ? 'TRACKING' : 'ACQUIRING'} />
              <SubsystemStatus label="Climate API" status={climateData ? 'nominal' : 'warning'} value={climateData ? 'STREAMING' : 'TIMEOUT'} />
            </div>
          </section>
        </aside>

        {/* ── CENTER COLUMN ── */}
        <main className="mc-col mc-col--center">
          {/* World Map with Events */}
          <section className="mc-card mc-card--map">
            <div className="mc-map-header">
              <h2 className="mc-card-title">🌍 GLOBAL EVENT MONITOR</h2>
              <span className="mc-map-count">{events.length} active events</span>
            </div>
            <EventWorldMap events={events} />
          </section>

          {/* Telemetry Row */}
          <div className="mc-telemetry-row">
            <div className="mc-telemetry-card">
              <div className="mc-telemetry-header">
                <span className="mc-telemetry-label">📶 Signal Strength</span>
                <span className="mc-telemetry-value">{telemetry.signalStrength[telemetry.signalStrength.length - 1].toFixed(1)} dBm</span>
              </div>
              <Sparkline data={telemetry.signalStrength} color="#10b981" height={36} width={140} />
            </div>
            <div className="mc-telemetry-card">
              <div className="mc-telemetry-header">
                <span className="mc-telemetry-label">⚡ Data Rate</span>
                <span className="mc-telemetry-value">{telemetry.dataRate[telemetry.dataRate.length - 1].toFixed(0)} Mbps</span>
              </div>
              <Sparkline data={telemetry.dataRate} color="#06b6d4" height={36} width={140} />
            </div>
            <div className="mc-telemetry-card">
              <div className="mc-telemetry-header">
                <span className="mc-telemetry-label">🌡️ Temperature</span>
                <span className="mc-telemetry-value">{telemetry.temperature[telemetry.temperature.length - 1].toFixed(1)}°C</span>
              </div>
              <Sparkline data={telemetry.temperature} color="#f59e0b" height={36} width={140} />
            </div>
            <div className="mc-telemetry-card">
              <div className="mc-telemetry-header">
                <span className="mc-telemetry-label">🔋 Power</span>
                <span className="mc-telemetry-value">{telemetry.power[telemetry.power.length - 1].toFixed(1)}%</span>
              </div>
              <Sparkline data={telemetry.power} color="#8b5cf6" height={36} width={140} />
            </div>
          </div>

          {/* ISS Live Tracker */}
          {iss && (
            <section className="mc-card mc-card--iss">
              <h2 className="mc-card-title">🏠 ISS LIVE POSITION</h2>
              <div className="mc-iss-grid">
                <div className="mc-iss-stat">
                  <span className="mc-iss-stat-label">Latitude</span>
                  <span className="mc-iss-stat-value">{iss.position.latitude.toFixed(4)}°</span>
                </div>
                <div className="mc-iss-stat">
                  <span className="mc-iss-stat-label">Longitude</span>
                  <span className="mc-iss-stat-value">{iss.position.longitude.toFixed(4)}°</span>
                </div>
                <div className="mc-iss-stat">
                  <span className="mc-iss-stat-label">Altitude</span>
                  <span className="mc-iss-stat-value">{(iss.position.altitude / 1000).toFixed(0)} km</span>
                </div>
                <div className="mc-iss-stat">
                  <span className="mc-iss-stat-label">Velocity</span>
                  <span className="mc-iss-stat-value">27,600 km/h</span>
                </div>
                <div className="mc-iss-stat">
                  <span className="mc-iss-stat-label">Orbit Period</span>
                  <span className="mc-iss-stat-value">92.5 min</span>
                </div>
                <div className="mc-iss-stat">
                  <span className="mc-iss-stat-label">Inclination</span>
                  <span className="mc-iss-stat-value">51.6°</span>
                </div>
              </div>
            </section>
          )}

          {/* Climate Data Row */}
          <div className="mc-climate-row">
            <div className="mc-climate-card">
              <div className="mc-climate-icon">🌡️</div>
              <div className="mc-climate-info">
                <span className="mc-climate-label">Avg Temp (NYC)</span>
                <span className="mc-climate-value">
                  <AnimatedNumber target={tempData[tempData.length - 1] || 22} decimals={1} suffix="°C" />
                </span>
              </div>
              <Sparkline data={tempData} color="#ef4444" height={30} width={80} />
            </div>
            <div className="mc-climate-card">
              <div className="mc-climate-icon">💧</div>
              <div className="mc-climate-info">
                <span className="mc-climate-label">Humidity</span>
                <span className="mc-climate-value">
                  <AnimatedNumber target={humidityData[humidityData.length - 1] || 69} decimals={0} suffix="%" />
                </span>
              </div>
              <Sparkline data={humidityData} color="#3b82f6" height={30} width={80} />
            </div>
            <div className="mc-climate-card">
              <div className="mc-climate-icon">☀️</div>
              <div className="mc-climate-info">
                <span className="mc-climate-label">Solar Irradiance</span>
                <span className="mc-climate-value">
                  <AnimatedNumber target={solarData[solarData.length - 1] || 5.2} decimals={1} suffix=" kWh/m²" />
                </span>
              </div>
              <Sparkline data={solarData} color="#f59e0b" height={30} width={80} />
            </div>
          </div>
        </main>

        {/* ── RIGHT COLUMN ── */}
        <aside className="mc-col mc-col--right">
          {/* Alert Feed */}
          <section className="mc-card mc-card--feed">
            <h2 className="mc-card-title">
              🔔 LIVE ALERT FEED
              <span className="mc-feed-badge">{alertFeed.length}</span>
            </h2>
            <div className="mc-feed-list" ref={feedRef}>
              {alertFeed.map((alert, idx) => (
                <div
                  key={alert.id}
                  className={`mc-feed-item mc-feed-item--${alert.severity}`}
                  style={{ animationDelay: `${idx * 0.05}s` }}
                  onClick={() => setSelectedEvent(events[idx] || null)}
                >
                  <div className="mc-feed-item-top">
                    <SeverityBadge category={alert.category} />
                    <span className="mc-feed-time">{alert.time}</span>
                  </div>
                  <p className="mc-feed-title">{alert.title}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Event Detail Card */}
          {selectedEvent && (
            <section className="mc-card mc-card--detail">
              <div className="mc-detail-header">
                <h2 className="mc-card-title">📋 EVENT DETAIL</h2>
                <button className="mc-detail-close" onClick={() => setSelectedEvent(null)}>✕</button>
              </div>
              <div className="mc-detail-body">
                <h3 className="mc-detail-name">{selectedEvent.title}</h3>
                <div className="mc-detail-meta">
                  {selectedEvent.categories?.map((c, i) => (
                    <SeverityBadge key={i} category={c.id} />
                  ))}
                </div>
                {selectedEvent.geometry?.[0]?.date && (
                  <p className="mc-detail-date">
                    📅 {new Date(selectedEvent.geometry[0].date).toLocaleDateString('en-US', { dateStyle: 'full' })}
                  </p>
                )}
                {selectedEvent.geometry?.[0]?.coordinates && (
                  <p className="mc-detail-coords">
                    📍 {selectedEvent.geometry[0].coordinates[1]?.toFixed(4)}°N, {selectedEvent.geometry[0].coordinates[0]?.toFixed(4)}°E
                  </p>
                )}
                {selectedEvent.sources?.map((s, i) => (
                  <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" className="mc-detail-source">
                    🔗 {s.id}
                  </a>
                ))}
              </div>
            </section>
          )}

          {/* Quick Actions */}
          <section className="mc-card">
            <h2 className="mc-card-title">⚡ QUICK ACTIONS</h2>
            <div className="mc-actions">
              <a href="/datasets" className="mc-action-btn mc-action-btn--cyan">
                🗂️ Browse Datasets
              </a>
              <a href="/analysis" className="mc-action-btn mc-action-btn--purple">
                🔬 Run Analysis
              </a>
              <a href="/globe" className="mc-action-btn mc-action-btn--emerald">
                🌐 3D Globe View
              </a>
              <a href="/fusion" className="mc-action-btn mc-action-btn--amber">
                🔗 Data Fusion
              </a>
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}

export default MissionControl
