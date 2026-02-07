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

// ─── Realistic Flat World Map with event pins ───────────────
function EventWorldMap({ events, iss }) {
  const [tooltip, setTooltip] = useState(null)

  // lon/lat → SVG coords (Equirectangular projection, viewBox 0 0 1010 505)
  const project = (lon, lat) => [((lon + 180) / 360) * 1010, ((90 - lat) / 180) * 505]

  // Category info for pins
  const catInfo = {
    wildfires:    { color: '#ef4444', icon: '🔥', label: 'Fire' },
    severeStorms: { color: '#8b5cf6', icon: '🌀', label: 'Storm' },
    volcanoes:    { color: '#f97316', icon: '🌋', label: 'Volcano' },
    floods:       { color: '#3b82f6', icon: '🌊', label: 'Flood' },
    earthquakes:  { color: '#eab308', icon: '⚡', label: 'Quake' },
    seaLakeIce:   { color: '#06b6d4', icon: '❄️', label: 'Ice' },
    snow:         { color: '#e2e8f0', icon: '🌨️', label: 'Snow' },
    drought:      { color: '#d97706', icon: '☀️', label: 'Drought' },
    landslides:   { color: '#a3622a', icon: '⛰️', label: 'Slide' },
  }

  return (
    <div className="mc-worldmap-container">
      <svg viewBox="0 0 1010 505" className="mc-worldmap-svg" preserveAspectRatio="xMidYMid meet">
        <defs>
          <radialGradient id="mcOcean" cx="50%" cy="45%" r="65%">
            <stop offset="0%" stopColor="#0c1a2e" />
            <stop offset="100%" stopColor="#060a13" />
          </radialGradient>
          <filter id="mcGlow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Ocean background */}
        <rect width="1010" height="505" fill="url(#mcOcean)" rx="4" />

        {/* Grid – latitude */}
        {[-60, -30, 0, 30, 60].map(lat => {
          const [, y] = project(0, lat)
          return <line key={`lat${lat}`} x1="0" y1={y} x2="1010" y2={y} stroke="rgba(6,182,212,0.06)" strokeWidth="0.5" />
        })}
        {/* Grid – longitude */}
        {[-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150].map(lon => {
          const [x] = project(lon, 0)
          return <line key={`lon${lon}`} x1={x} y1="0" x2={x} y2="505" stroke="rgba(6,182,212,0.06)" strokeWidth="0.5" />
        })}
        {/* Equator highlight */}
        <line x1="0" y1={252.5} x2="1010" y2={252.5} stroke="rgba(6,182,212,0.1)" strokeWidth="0.6" strokeDasharray="8 4" />

        {/* ═══ CONTINENT PATHS ═══ */}

        {/* North America */}
        <path d="M135,48 L140,42 148,38 160,35 175,33 190,36 205,32 218,28 230,25 240,28 248,35 252,42 250,52 258,55 268,52 278,56 288,48 296,50 298,58 290,65 284,72 278,78 275,86 280,94 285,100 290,108 286,116 278,122 272,130 268,138 266,146 260,154 255,160 248,168 242,174 236,180 228,186 220,192 212,196 205,202 198,208 188,216 178,220 168,225 158,230 150,236 145,240 140,244 L136,238 130,230 122,225 114,218 106,210 98,200 90,190 82,178 76,168 70,158 65,148 60,138 56,126 54,116 53,105 56,95 62,86 70,78 80,72 92,66 105,60 118,54 Z" fill="rgba(16,185,129,0.1)" stroke="rgba(16,185,129,0.35)" strokeWidth="0.8" strokeLinejoin="round" />
        {/* Central America */}
        <path d="M140,244 L148,246 155,250 160,256 165,260 170,258 175,254 178,248 182,252 180,260 175,266 170,270 165,268 158,270 152,266 148,262 142,258 138,254 136,248 Z" fill="rgba(16,185,129,0.1)" stroke="rgba(16,185,129,0.35)" strokeWidth="0.8" strokeLinejoin="round" />
        {/* Greenland */}
        <path d="M310,22 L320,18 335,16 348,18 358,24 365,32 368,42 365,52 358,62 348,68 336,72 324,70 314,64 306,56 302,46 304,36 308,28 Z" fill="rgba(16,185,129,0.1)" stroke="rgba(16,185,129,0.35)" strokeWidth="0.8" strokeLinejoin="round" />

        {/* South America */}
        <path d="M218,268 L228,264 240,262 250,266 258,272 264,278 268,286 270,296 268,308 264,320 260,332 254,344 248,354 242,364 236,374 230,382 224,390 218,398 214,406 210,414 206,420 202,428 200,434 198,440 196,444 L192,440 188,432 186,422 188,412 190,402 192,392 194,382 196,370 198,358 200,346 202,336 204,324 206,312 206,302 208,292 210,282 214,274 Z" fill="rgba(16,185,129,0.1)" stroke="rgba(16,185,129,0.35)" strokeWidth="0.8" strokeLinejoin="round" />

        {/* Europe */}
        <path d="M475,40 L482,36 490,38 496,44 502,48 508,44 514,38 522,35 530,38 536,44 542,52 548,58 554,66 558,74 555,82 550,88 546,96 548,104 544,112 538,118 530,124 524,130 518,136 514,142 508,148 504,154 498,158 492,162 486,158 480,150 476,142 472,134 468,126 464,118 462,110 460,102 462,94 465,86 468,78 470,68 472,58 474,48 Z" fill="rgba(59,130,246,0.1)" stroke="rgba(59,130,246,0.35)" strokeWidth="0.8" strokeLinejoin="round" />
        {/* British Isles */}
        <path d="M448,78 L454,72 460,74 464,80 462,88 456,94 450,96 446,90 444,84 Z" fill="rgba(59,130,246,0.1)" stroke="rgba(59,130,246,0.35)" strokeWidth="0.8" strokeLinejoin="round" />
        <path d="M440,88 L446,86 448,92 444,96 440,94 Z" fill="rgba(59,130,246,0.1)" stroke="rgba(59,130,246,0.35)" strokeWidth="0.8" strokeLinejoin="round" />
        {/* Scandinavia */}
        <path d="M502,22 L510,18 520,20 528,26 534,34 530,38 522,35 514,38 508,44 502,48 496,44 494,36 498,28 Z" fill="rgba(59,130,246,0.1)" stroke="rgba(59,130,246,0.35)" strokeWidth="0.8" strokeLinejoin="round" />
        {/* Iceland */}
        <path d="M418,48 L426,44 434,46 438,52 434,58 426,60 420,56 Z" fill="rgba(59,130,246,0.1)" stroke="rgba(59,130,246,0.35)" strokeWidth="0.8" strokeLinejoin="round" />

        {/* Africa */}
        <path d="M462,170 L472,166 484,164 496,168 508,172 518,178 528,186 536,196 542,208 546,222 548,236 550,250 548,264 544,278 538,292 532,304 524,316 516,326 508,336 500,344 494,352 490,360 486,366 482,370 L476,366 470,358 466,348 462,336 458,324 454,312 450,300 448,288 446,276 446,264 446,252 448,240 450,228 452,216 452,204 450,192 448,182 452,174 Z" fill="rgba(245,158,11,0.1)" stroke="rgba(245,158,11,0.35)" strokeWidth="0.8" strokeLinejoin="round" />
        {/* Madagascar */}
        <path d="M562,316 L568,310 574,314 578,324 576,336 572,346 566,352 560,346 558,336 560,326 Z" fill="rgba(245,158,11,0.1)" stroke="rgba(245,158,11,0.35)" strokeWidth="0.8" strokeLinejoin="round" />

        {/* Asia */}
        <path d="M558,74 L568,66 580,58 594,52 610,48 628,45 648,44 668,46 688,50 708,48 726,44 744,42 760,44 776,48 790,54 802,48 814,44 828,42 842,46 854,52 864,60 874,70 882,80 886,92 884,104 878,114 870,122 862,130 854,138 846,146 838,152 828,158 818,164 808,170 796,176 784,182 774,188 764,194 754,200 744,206 734,210 722,214 710,212 698,206 686,198 676,192 666,188 656,186 646,190 636,196 626,204 618,212 612,220 608,228 604,236 598,240 590,238 582,232 576,224 570,216 564,206 558,196 552,186 546,178 540,170 534,164 528,158 520,152 518,148 524,140 532,132 540,122 546,112 548,104 546,96 550,88 555,82 Z" fill="rgba(139,92,246,0.1)" stroke="rgba(139,92,246,0.35)" strokeWidth="0.8" strokeLinejoin="round" />
        {/* Japan */}
        <path d="M884,104 L892,96 898,102 900,112 898,124 894,134 888,142 882,146 878,140 876,130 880,118 Z" fill="rgba(139,92,246,0.1)" stroke="rgba(139,92,246,0.35)" strokeWidth="0.8" strokeLinejoin="round" />
        {/* India */}
        <path d="M656,186 L666,188 676,192 686,198 694,208 698,220 696,234 692,248 686,260 680,270 674,276 668,270 664,258 660,246 656,234 652,222 650,210 648,198 650,190 Z" fill="rgba(139,92,246,0.1)" stroke="rgba(139,92,246,0.35)" strokeWidth="0.8" strokeLinejoin="round" />
        {/* Sri Lanka */}
        <path d="M676,282 L682,278 686,284 684,292 678,296 674,290 Z" fill="rgba(139,92,246,0.1)" stroke="rgba(139,92,246,0.35)" strokeWidth="0.8" strokeLinejoin="round" />
        {/* SE Asia peninsula */}
        <path d="M744,206 L752,212 758,220 760,232 756,242 750,250 744,258 740,266 736,258 734,248 736,238 738,228 740,218 Z" fill="rgba(139,92,246,0.1)" stroke="rgba(139,92,246,0.35)" strokeWidth="0.8" strokeLinejoin="round" />
        {/* Indonesia */}
        <path d="M752,264 L762,258 774,260 786,262 798,266 808,270 818,268 826,264 834,268 838,276 832,282 822,284 812,282 800,278 790,276 778,274 766,272 756,270 Z" fill="rgba(139,92,246,0.1)" stroke="rgba(139,92,246,0.35)" strokeWidth="0.8" strokeLinejoin="round" />
        {/* Philippines */}
        <path d="M826,208 L832,202 838,206 840,216 836,226 830,232 824,226 822,216 Z" fill="rgba(139,92,246,0.1)" stroke="rgba(139,92,246,0.35)" strokeWidth="0.8" strokeLinejoin="round" />
        {/* Taiwan */}
        <path d="M836,182 L842,178 846,184 844,192 838,194 834,188 Z" fill="rgba(139,92,246,0.1)" stroke="rgba(139,92,246,0.35)" strokeWidth="0.8" strokeLinejoin="round" />
        {/* Korean Peninsula */}
        <path d="M856,110 L862,104 868,108 870,118 866,128 860,134 854,128 854,118 Z" fill="rgba(139,92,246,0.1)" stroke="rgba(139,92,246,0.35)" strokeWidth="0.8" strokeLinejoin="round" />
        {/* Middle East / Arabian Peninsula */}
        <path d="M556,186 L566,180 578,178 588,182 598,190 604,200 606,212 604,222 598,224 590,220 582,216 574,210 566,204 560,196 Z" fill="rgba(139,92,246,0.1)" stroke="rgba(139,92,246,0.35)" strokeWidth="0.8" strokeLinejoin="round" />

        {/* Australia */}
        <path d="M812,318 L826,310 842,304 860,300 878,302 894,310 904,322 910,336 914,352 910,366 904,378 894,388 882,396 868,400 854,398 840,392 828,384 818,374 810,362 804,348 802,334 806,324 Z" fill="rgba(234,179,8,0.1)" stroke="rgba(234,179,8,0.35)" strokeWidth="0.8" strokeLinejoin="round" />
        {/* Tasmania */}
        <path d="M884,406 L892,402 898,408 896,416 890,420 884,414 Z" fill="rgba(234,179,8,0.1)" stroke="rgba(234,179,8,0.35)" strokeWidth="0.8" strokeLinejoin="round" />
        {/* New Zealand */}
        <path d="M942,370 L948,364 954,370 956,380 952,392 946,400 940,396 938,386 940,378 Z" fill="rgba(234,179,8,0.1)" stroke="rgba(234,179,8,0.35)" strokeWidth="0.8" strokeLinejoin="round" />
        <path d="M946,402 L952,398 956,404 954,412 948,416 944,410 Z" fill="rgba(234,179,8,0.1)" stroke="rgba(234,179,8,0.35)" strokeWidth="0.8" strokeLinejoin="round" />
        {/* Papua New Guinea */}
        <path d="M870,272 L880,268 892,270 900,276 904,284 900,292 892,296 882,294 874,288 870,280 Z" fill="rgba(234,179,8,0.1)" stroke="rgba(234,179,8,0.35)" strokeWidth="0.8" strokeLinejoin="round" />

        {/* Antarctica */}
        <path d="M30,480 L80,472 140,466 220,462 320,458 420,456 505,455 590,456 690,458 790,462 870,466 930,472 980,480 990,495 990,505 20,505 20,495 Z" fill="rgba(148,163,184,0.08)" stroke="rgba(148,163,184,0.2)" strokeWidth="0.8" strokeLinejoin="round" />

        {/* ═══ EVENT PIN MARKERS ═══ */}
        {events.map((evt, i) => {
          const geo = evt.geometry?.[0] || evt.geometry
          if (!geo?.coordinates) return null
          const coords = Array.isArray(geo.coordinates[0]) ? geo.coordinates[0] : geo.coordinates
          const [x, y] = project(coords[0], coords[1])
          const catId = evt.categories?.[0]?.id || ''
          const info = catInfo[catId] || { color: '#f59e0b', icon: '📡', label: 'Event' }

          return (
            <g key={i}
              onMouseEnter={() => setTooltip({ x, y, title: evt.title, cat: info.label, icon: info.icon })}
              onMouseLeave={() => setTooltip(null)}
              style={{ cursor: 'pointer' }}
            >
              {/* Pulse ring */}
              <circle cx={x} cy={y} r="6" fill={info.color} opacity="0.15" className="mc-map-pulse" />
              {/* Pin shadow */}
              <circle cx={x} cy={y + 1} r="3" fill="rgba(0,0,0,0.4)" />
              {/* Pin glow */}
              <circle cx={x} cy={y} r="4" fill={info.color} opacity="0.3" />
              {/* Pin dot */}
              <circle cx={x} cy={y} r="2.5" fill={info.color} stroke="rgba(255,255,255,0.5)" strokeWidth="0.5" />
              {/* Icon */}
              <text x={x} y={y - 7} textAnchor="middle" fontSize="7" dominantBaseline="auto">{info.icon}</text>
            </g>
          )
        })}

        {/* ISS marker */}
        {iss && (() => {
          const [ix, iy] = project(iss.position.longitude, iss.position.latitude)
          return (
            <g filter="url(#mcGlow)">
              <circle cx={ix} cy={iy} r="8" fill="rgba(16,185,129,0.15)" className="mc-map-pulse" />
              <circle cx={ix} cy={iy} r="4" fill="#10b981" opacity="0.5" />
              <circle cx={ix} cy={iy} r="2" fill="#10b981" stroke="#fff" strokeWidth="0.6" />
              <text x={ix} y={iy - 10} textAnchor="middle" fontSize="7">🛰️</text>
              <text x={ix + 12} y={iy + 3} fill="#10b981" fontSize="6" fontFamily="monospace" fontWeight="bold">ISS</text>
            </g>
          )
        })()}

        {/* Tooltip */}
        {tooltip && (
          <g>
            <rect
              x={tooltip.x - 60} y={tooltip.y - 34}
              width="120" height="22" rx="4"
              fill="rgba(15,23,42,0.92)" stroke="rgba(6,182,212,0.3)" strokeWidth="0.5"
            />
            <text x={tooltip.x} y={tooltip.y - 20} textAnchor="middle" fill="#e2e8f0" fontSize="6" fontFamily="monospace">
              {tooltip.icon} {tooltip.title?.slice(0, 28)}{tooltip.title?.length > 28 ? '…' : ''}
            </text>
          </g>
        )}
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
            <EventWorldMap events={events} iss={iss} />
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
