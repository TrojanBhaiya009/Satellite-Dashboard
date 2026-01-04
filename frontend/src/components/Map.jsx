import React, { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useMapStore } from '../store'

function MapComponent() {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const center = useMapStore(state => state.center)
  const zoom = useMapStore(state => state.zoom)

  useEffect(() => {
    if (!map.current && mapContainer.current) {
      map.current = L.map(mapContainer.current).setView(center, zoom)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map.current)

      // Add sample polygon
      const polygon = L.polygon([
        [28, 77],
        [28.5, 77],
        [28.5, 77.5],
        [28, 77.5]
      ], {
        color: '#60a5fa',
        weight: 2,
        opacity: 0.8,
        dashArray: '5, 5'
      }).addTo(map.current)

      map.current.fitBounds(polygon.getBounds())
    }
  }, [])

  return (
    <div ref={mapContainer} className="w-full h-full rounded-lg" style={{ position: 'relative' }} />
  )
}

export default MapComponent
