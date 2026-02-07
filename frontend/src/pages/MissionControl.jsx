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

// ─── Flat World Map (accurate outlines, reference-image colors) ───
function EventWorldMap({ events, iss }) {
  const [tooltip, setTooltip] = useState(null)

  // Equirectangular: lon/lat → SVG x,y  (viewBox 0 0 1000 500)
  // x = (lon+180)/360*1000   y = (90-lat)/180*500
  const proj = (lon, lat) => [((lon + 180) / 360) * 1000, ((90 - lat) / 180) * 500]

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

  /* ── colour palette matching reference image ── */
  const NA  = { fill: 'rgba(205,115,115,0.18)', stroke: 'rgba(205,115,115,0.5)' } // pink-red
  const SA  = { fill: 'rgba(120,170,220,0.18)', stroke: 'rgba(120,170,220,0.5)' } // light blue
  const EU  = { fill: 'rgba(190,130,155,0.18)', stroke: 'rgba(190,130,155,0.5)' } // mauve-pink
  const AF  = { fill: 'rgba(220,185,110,0.18)', stroke: 'rgba(220,185,110,0.5)' } // tan-orange
  const AS  = { fill: 'rgba(170,150,210,0.18)', stroke: 'rgba(170,150,210,0.5)' } // lavender-purple
  const OC  = { fill: 'rgba(90,190,120,0.18)',  stroke: 'rgba(90,190,120,0.5)'  } // green
  const AN  = { fill: 'rgba(190,195,205,0.10)', stroke: 'rgba(190,195,205,0.3)' } // light gray

  return (
    <div className="mc-worldmap-container">
      <svg viewBox="0 0 1000 500" className="mc-worldmap-svg" preserveAspectRatio="xMidYMid meet">
        <defs>
          <radialGradient id="mcOcean" cx="50%" cy="45%" r="70%">
            <stop offset="0%" stopColor="#0d1b2e" />
            <stop offset="100%" stopColor="#060a13" />
          </radialGradient>
          <filter id="mcGlow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Ocean */}
        <rect width="1000" height="500" fill="url(#mcOcean)" rx="4" />

        {/* Grid – latitudes */}
        {[-60,-30,0,30,60].map(lat => {
          const y = ((90-lat)/180)*500
          return <line key={`la${lat}`} x1="0" y1={y} x2="1000" y2={y} stroke="rgba(6,182,212,0.05)" strokeWidth="0.4" />
        })}
        {/* Grid – longitudes */}
        {[-150,-120,-90,-60,-30,0,30,60,90,120,150].map(lon => {
          const x = ((lon+180)/360)*1000
          return <line key={`lo${lon}`} x1={x} y1="0" x2={x} y2="500" stroke="rgba(6,182,212,0.05)" strokeWidth="0.4" />
        })}
        {/* Equator */}
        <line x1="0" y1="250" x2="1000" y2="250" stroke="rgba(6,182,212,0.08)" strokeWidth="0.5" strokeDasharray="6 3" />

        {/* ═══════ NORTH AMERICA (pink-red) ═══════ */}
        {/* Alaska */}
        <path d="M 30,58 L 26,67 22,78 28,86 36,94 44,97 56,94 67,92 78,94 86,89 83,83 75,78 67,72 58,67 50,61 42,56 36,53 Z"
          fill={NA.fill} stroke={NA.stroke} strokeWidth="0.7" strokeLinejoin="round" />
        {/* Canada + USA mainland */}
        <path d="M 92,67 L 100,61 111,56 125,53 139,50 150,50 161,47 172,44 183,42 194,42 206,39 217,36 228,33 239,33 250,36 258,39 264,44 272,42 281,44 289,50 283,53 278,58 272,64 267,72 264,78 261,83 264,89 267,94 272,97 275,103 278,108 281,114 278,119 275,125 272,131 269,136 264,142 258,147 253,153 250,158 244,164 239,169 233,175 228,178 222,181 217,183 211,186 206,189 200,192 194,194 189,197 183,200 178,203 172,206 167,208 161,211 156,214 150,219 144,225 L 139,231 L 147,233 153,236 156,239 158,244 156,247 150,250 147,253 144,256 139,258 133,261 128,264 119,269
          L 122,264 125,258 131,256 131,250 122,244 117,242 111,244 106,244
          L 108,236 114,228 119,222 122,217 125,211 128,206 131,200 133,194
          L 131,189 128,183 125,178 119,172 114,167 108,164 103,161 97,161
          L 92,164 89,167 86,172 83,178 78,183 72,186 67,189 61,192
          L 56,194 50,194 42,192 36,189 31,186 28,181 25,175 22,169
          L 19,164 17,158 17,153 19,147 22,142 25,136 28,131 33,125
          L 39,119 44,114 50,108 56,106 61,103 67,100 72,97 78,94
          L 83,92 86,89 89,83 92,78 92,72 Z"
          fill={NA.fill} stroke={NA.stroke} strokeWidth="0.7" strokeLinejoin="round" />
        {/* Mexico */}
        <path d="M 128,264 L 133,261 139,258 144,256 147,253 150,250 153,250 156,247
          L 158,253 161,258 164,261 167,264 169,267 172,269 175,267 178,264
          L 181,258 183,253 186,247 189,244 192,242 194,244 197,247 200,253
          L 203,261 206,267 208,272 L 200,275 194,272 189,269 183,269 178,272
          L 172,272 167,272 161,272 158,275 153,278 147,278 142,275 139,272
          L 136,269 131,267 Z"
          fill={NA.fill} stroke={NA.stroke} strokeWidth="0.7" strokeLinejoin="round" />
        {/* Greenland */}
        <path d="M 300,22 L 308,17 319,14 331,14 342,17 350,22 356,28 361,36 364,44
          L 361,53 356,61 350,67 342,72 333,75 325,75 317,72 308,67 303,61
          L 297,53 294,44 294,36 297,28 Z"
          fill={NA.fill} stroke={NA.stroke} strokeWidth="0.7" strokeLinejoin="round" />

        {/* ═══════ SOUTH AMERICA (light blue) ═══════ */}
        <path d="M 208,272 L 214,269 222,267 231,267 239,269 244,272 250,278
          L 256,283 261,289 264,297 267,303 269,311 269,319 267,328
          L 264,336 261,344 258,350 253,358 250,364 244,372 239,378
          L 233,386 228,392 222,397 219,403 214,408 211,414 208,419
          L 206,425 203,431 200,436 197,439 194,442 192,444
          L 189,442 186,436 186,428 186,422 186,414 186,406
          L 189,397 192,389 194,381 194,372 197,364 200,356
          L 200,347 200,339 200,331 200,322 203,314 203,306
          L 206,297 206,289 206,281 Z"
          fill={SA.fill} stroke={SA.stroke} strokeWidth="0.7" strokeLinejoin="round" />

        {/* ═══════ EUROPE (mauve-pink) ═══════ */}
        {/* Mainland */}
        <path d="M 472,56 L 478,50 483,47 489,44 494,42 500,44 503,47 506,50
          L 511,47 517,44 522,42 528,42 533,44 536,47 539,50 542,53
          L 544,58 547,64 550,69 553,75 556,81 553,86 550,92
          L 547,97 544,103 547,108 544,114 539,117 533,122
          L 528,125 522,128 517,131 514,136 511,139 506,144
          L 503,147 500,150 497,153 494,156 492,158 489,158
          L 483,156 478,150 475,147 472,142 469,136 467,131
          L 464,125 461,119 458,114 456,108 456,103 458,97
          L 458,92 461,86 464,81 467,75 469,69 472,64 Z"
          fill={EU.fill} stroke={EU.stroke} strokeWidth="0.7" strokeLinejoin="round" />
        {/* Scandinavia + Finland */}
        <path d="M 500,17 L 506,14 514,14 519,17 525,22 528,28 531,33 533,39
          L 533,44 528,42 522,42 517,44 511,47 506,50 503,47
          L 500,44 497,39 494,33 494,28 497,22 Z"
          fill={EU.fill} stroke={EU.stroke} strokeWidth="0.7" strokeLinejoin="round" />
        {/* Great Britain */}
        <path d="M 450,75 L 456,72 461,72 464,75 464,81 461,86 458,89
          L 453,92 450,89 447,86 447,81 Z"
          fill={EU.fill} stroke={EU.stroke} strokeWidth="0.7" strokeLinejoin="round" />
        {/* Ireland */}
        <path d="M 442,81 L 447,78 450,81 450,86 447,89 442,89 440,86 Z"
          fill={EU.fill} stroke={EU.stroke} strokeWidth="0.7" strokeLinejoin="round" />
        {/* Iceland */}
        <path d="M 417,47 L 422,44 428,44 433,47 436,50 433,56 428,58 422,58 419,53 Z"
          fill={EU.fill} stroke={EU.stroke} strokeWidth="0.7" strokeLinejoin="round" />
        {/* Italy */}
        <path d="M 503,147 L 508,150 511,156 514,161 514,167 511,172
          L 506,172 503,167 500,161 500,156 Z"
          fill={EU.fill} stroke={EU.stroke} strokeWidth="0.7" strokeLinejoin="round" />
        {/* Iberian Peninsula */}
        <path d="M 458,139 L 464,136 469,136 475,139 478,144 478,150
          L 475,156 472,161 467,164 461,164 456,161 453,156
          L 453,150 456,144 Z"
          fill={EU.fill} stroke={EU.stroke} strokeWidth="0.7" strokeLinejoin="round" />
        {/* Greece */}
        <path d="M 522,153 L 528,150 533,153 533,158 531,164 528,167
          L 522,167 519,161 519,156 Z"
          fill={EU.fill} stroke={EU.stroke} strokeWidth="0.7" strokeLinejoin="round" />

        {/* ═══════ AFRICA (tan-orange) ═══════ */}
        <path d="M 461,172 L 467,169 472,167 478,167 483,167 489,169
          L 497,169 503,172 511,175 519,178 528,183 533,189
          L 539,194 542,200 544,206 547,214 550,222 550,231
          L 553,239 553,247 553,256 553,264 550,272 547,281
          L 544,289 542,297 539,303 536,311 533,317 528,325
          L 525,331 522,336 519,342 517,347 514,353 511,358
          L 508,364 503,369 500,372 497,375 494,378 492,381
          L 489,381 486,378 483,372 478,364 475,356 472,347
          L 469,339 467,331 464,322 461,314 458,306 456,297
          L 453,289 450,281 450,272 450,264 450,256 450,247
          L 450,239 450,231 453,222 453,214 453,206 453,197
          L 453,189 453,181 456,175 Z"
          fill={AF.fill} stroke={AF.stroke} strokeWidth="0.7" strokeLinejoin="round" />
        {/* Madagascar */}
        <path d="M 558,319 L 564,314 569,317 572,325 572,333 569,342
          L 564,347 558,344 556,336 556,328 Z"
          fill={AF.fill} stroke={AF.stroke} strokeWidth="0.7" strokeLinejoin="round" />

        {/* ═══════ ASIA (lavender-purple) ═══════ */}
        {/* Main body */}
        <path d="M 556,81 L 561,75 567,69 575,64 583,58 594,53 606,50
          L 617,47 628,44 639,42 650,42 661,44 672,47 683,50
          L 694,50 706,47 717,44 728,42 739,42 750,44 761,47
          L 769,50 778,53 786,56 794,53 800,50 808,47 817,44
          L 825,42 833,42 842,44 850,50 856,56 864,61 869,67
          L 875,75 881,83 886,92 889,100 889,108 886,117
          L 881,122 875,128 869,133 864,139 858,144 853,150
          L 847,156 842,161 836,164 831,169 825,172 819,175
          L 811,178 803,181 797,183 792,186 786,189 781,192
          L 775,194 769,197 764,200 758,203 750,206 744,208
          L 739,211 731,214 722,217 714,214 706,211 697,206
          L 689,200 683,194 675,192 667,189 658,186
          L 650,186 642,189 633,194 628,200 622,206
          L 617,211 611,217 606,222 603,228 600,233
          L 597,239 594,242 589,239 583,233 578,228
          L 572,222 567,214 564,208 558,200 553,192
          L 547,183 542,175 536,169 531,164 525,158
          L 522,153 525,147 528,142 533,136 536,131
          L 539,125 542,119 544,114 547,108 544,103
          L 547,97 550,92 553,86 Z"
          fill={AS.fill} stroke={AS.stroke} strokeWidth="0.7" strokeLinejoin="round" />
        {/* Arabian Peninsula */}
        <path d="M 556,181 L 564,178 572,175 581,178 589,183 594,189
          L 600,197 606,206 608,214 606,222 603,228
          L 597,231 592,228 586,222 581,217 575,211
          L 569,206 564,200 558,194 556,189 Z"
          fill={AS.fill} stroke={AS.stroke} strokeWidth="0.7" strokeLinejoin="round" />
        {/* India */}
        <path d="M 658,186 L 667,189 675,192 683,197 692,206 697,217
          L 697,228 694,239 689,250 683,261 678,269 672,275
          L 667,269 664,258 658,247 656,236 653,225 650,214
          L 647,203 647,194 650,189 Z"
          fill={AS.fill} stroke={AS.stroke} strokeWidth="0.7" strokeLinejoin="round" />
        {/* Sri Lanka */}
        <path d="M 675,281 L 681,278 683,283 681,289 678,292 672,289 Z"
          fill={AS.fill} stroke={AS.stroke} strokeWidth="0.6" strokeLinejoin="round" />
        {/* Indochina peninsula */}
        <path d="M 744,208 L 750,214 756,222 758,231 756,242 750,250
          L 744,258 739,264 736,258 733,247 733,239 736,228 739,219 Z"
          fill={AS.fill} stroke={AS.stroke} strokeWidth="0.7" strokeLinejoin="round" />
        {/* Korean Peninsula */}
        <path d="M 858,108 L 864,103 869,108 869,117 867,125 861,131
          L 856,128 853,119 856,114 Z"
          fill={AS.fill} stroke={AS.stroke} strokeWidth="0.6" strokeLinejoin="round" />
        {/* Japan */}
        <path d="M 883,97 L 889,92 894,97 897,106 897,117 894,128
          L 889,136 886,142 881,144 878,139 878,128 881,117 881,106 Z"
          fill={AS.fill} stroke={AS.stroke} strokeWidth="0.7" strokeLinejoin="round" />
        {/* Taiwan */}
        <path d="M 839,181 L 844,178 847,183 844,189 839,189 836,186 Z"
          fill={AS.fill} stroke={AS.stroke} strokeWidth="0.6" strokeLinejoin="round" />
        {/* Philippines */}
        <path d="M 828,206 L 833,200 839,206 839,214 836,222 831,228
          L 825,225 825,217 Z"
          fill={AS.fill} stroke={AS.stroke} strokeWidth="0.6" strokeLinejoin="round" />
        {/* Indonesia – Sumatra,Java,Borneo chain */}
        <path d="M 750,264 L 758,258 769,258 778,261 786,264 794,267
          L 803,269 811,267 819,264 828,264 836,269 839,275
          L 833,281 825,281 814,281 803,278 794,275 786,275
          L 775,272 764,272 756,269 Z"
          fill={AS.fill} stroke={AS.stroke} strokeWidth="0.6" strokeLinejoin="round" />

        {/* ═══════ OCEANIA (green) ═══════ */}
        {/* Australia */}
        <path d="M 808,314 L 819,306 831,300 844,297 856,294 869,297
          L 881,303 889,311 897,322 903,333 906,344 906,356
          L 903,367 897,378 889,386 881,392 872,397 861,400
          L 850,400 839,394 828,386 819,378 811,367 806,356
          L 803,344 803,333 Z"
          fill={OC.fill} stroke={OC.stroke} strokeWidth="0.7" strokeLinejoin="round" />
        {/* Tasmania */}
        <path d="M 883,406 L 889,403 894,406 894,414 889,417 883,414 Z"
          fill={OC.fill} stroke={OC.stroke} strokeWidth="0.6" strokeLinejoin="round" />
        {/* Papua New Guinea */}
        <path d="M 867,272 L 878,267 889,269 897,275 900,283 897,289
          L 889,292 881,292 875,286 869,281 Z"
          fill={OC.fill} stroke={OC.stroke} strokeWidth="0.6" strokeLinejoin="round" />
        {/* New Zealand North */}
        <path d="M 939,367 L 944,361 950,367 950,378 947,386 942,392
          L 936,389 936,381 Z"
          fill={OC.fill} stroke={OC.stroke} strokeWidth="0.6" strokeLinejoin="round" />
        {/* New Zealand South */}
        <path d="M 942,394 L 947,392 950,397 950,406 947,411 942,411
          L 939,406 939,400 Z"
          fill={OC.fill} stroke={OC.stroke} strokeWidth="0.6" strokeLinejoin="round" />

        {/* ═══════ ANTARCTICA (gray) ═══════ */}
        <path d="M 20,478 L 60,472 120,467 200,464 300,461 400,458
          L 500,456 600,458 700,461 800,464 880,467 940,472
          L 980,478 985,492 985,500 15,500 15,492 Z"
          fill={AN.fill} stroke={AN.stroke} strokeWidth="0.7" strokeLinejoin="round" />

        {/* ═══════ CONTINENT LABELS ═══════ */}
        <text x="145" y="142" fill="rgba(205,115,115,0.45)" fontSize="10" fontWeight="600" fontFamily="sans-serif" textAnchor="middle">North America</text>
        <text x="225" y="347" fill="rgba(120,170,220,0.5)" fontSize="10" fontWeight="600" fontFamily="sans-serif" textAnchor="middle">South America</text>
        <text x="503" y="106" fill="rgba(190,130,155,0.5)" fontSize="9" fontWeight="600" fontFamily="sans-serif" textAnchor="middle">Europe</text>
        <text x="500" y="278" fill="rgba(220,185,110,0.5)" fontSize="10" fontWeight="600" fontFamily="sans-serif" textAnchor="middle">Africa</text>
        <text x="740" y="117" fill="rgba(170,150,210,0.45)" fontSize="11" fontWeight="600" fontFamily="sans-serif" textAnchor="middle">Asia</text>
        <text x="860" y="358" fill="rgba(90,190,120,0.55)" fontSize="9" fontWeight="600" fontFamily="sans-serif" textAnchor="middle">Oceania</text>
        <text x="500" y="490" fill="rgba(190,195,205,0.35)" fontSize="9" fontWeight="600" fontFamily="sans-serif" textAnchor="middle">Antarctica</text>

        {/* ═══════ EVENT PIN MARKERS ═══════ */}
        {events.map((evt, i) => {
          const geo = evt.geometry?.[0] || evt.geometry
          if (!geo?.coordinates) return null
          const coords = Array.isArray(geo.coordinates[0]) ? geo.coordinates[0] : geo.coordinates
          const [x, y] = proj(coords[0], coords[1])
          const catId = evt.categories?.[0]?.id || ''
          const info = catInfo[catId] || { color: '#f59e0b', icon: '📡', label: 'Event' }

          return (
            <g key={i}
              onMouseEnter={() => setTooltip({ x, y, title: evt.title, cat: info.label, icon: info.icon })}
              onMouseLeave={() => setTooltip(null)}
              style={{ cursor: 'pointer' }}
            >
              <circle cx={x} cy={y} r="6" fill={info.color} opacity="0.15" className="mc-map-pulse" />
              <circle cx={x} cy={y + 1} r="3" fill="rgba(0,0,0,0.35)" />
              <circle cx={x} cy={y} r="3.5" fill={info.color} opacity="0.25" />
              <circle cx={x} cy={y} r="2" fill={info.color} stroke="rgba(255,255,255,0.6)" strokeWidth="0.5" />
              <text x={x} y={y - 6} textAnchor="middle" fontSize="6.5" dominantBaseline="auto">{info.icon}</text>
            </g>
          )
        })}

        {/* ISS live position */}
        {iss && (() => {
          const [ix, iy] = proj(iss.position.longitude, iss.position.latitude)
          return (
            <g filter="url(#mcGlow)">
              <circle cx={ix} cy={iy} r="8" fill="rgba(16,185,129,0.12)" className="mc-map-pulse" />
              <circle cx={ix} cy={iy} r="3.5" fill="#10b981" opacity="0.4" />
              <circle cx={ix} cy={iy} r="2" fill="#10b981" stroke="#fff" strokeWidth="0.6" />
              <text x={ix} y={iy - 9} textAnchor="middle" fontSize="7">🛰️</text>
              <text x={ix + 11} y={iy + 3} fill="#10b981" fontSize="5.5" fontFamily="monospace" fontWeight="bold">ISS</text>
            </g>
          )
        })()}

        {/* Hover tooltip */}
        {tooltip && (
          <g>
            <rect x={Math.max(5, Math.min(tooltip.x - 65, 870))} y={tooltip.y - 32} width="130" height="20" rx="4"
              fill="rgba(15,23,42,0.92)" stroke="rgba(6,182,212,0.25)" strokeWidth="0.5" />
            <text x={Math.max(70, Math.min(tooltip.x, 935))} y={tooltip.y - 19} textAnchor="middle" fill="#e2e8f0" fontSize="5.5" fontFamily="monospace">
              {tooltip.icon} {tooltip.title?.slice(0, 30)}{tooltip.title?.length > 30 ? '…' : ''}
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
