// Real-time satellite data service
// Connects to NASA, Copernicus, and other open satellite data APIs

const NASA_GIBS_URL = 'https://gibs.earthdata.nasa.gov/wmts/epsg4326/best'
const NASA_EONET_URL = 'https://eonet.gsfc.nasa.gov/api/v3'
const NASA_POWER_URL = 'https://power.larc.nasa.gov/api/temporal/daily/point'

// NASA EONET - Real natural events (wildfires, storms, etc.)
export const fetchNaturalEvents = async (category = null, limit = 20) => {
  try {
    let url = `${NASA_EONET_URL}/events?status=open&limit=${limit}`
    if (category) {
      url += `&category=${category}`
    }
    const response = await fetch(url)
    const data = await response.json()
    return data.events || []
  } catch (error) {
    console.error('Error fetching natural events:', error)
    return []
  }
}

// Get event categories
export const fetchEventCategories = async () => {
  try {
    const response = await fetch(`${NASA_EONET_URL}/categories`)
    const data = await response.json()
    return data.categories || []
  } catch (error) {
    console.error('Error fetching categories:', error)
    return []
  }
}

// NASA POWER - Real climate/weather data for a location
export const fetchClimateData = async (lat, lon, startDate, endDate) => {
  try {
    const params = 'T2M,T2M_MAX,T2M_MIN,PRECTOTCORR,RH2M,WS2M,ALLSKY_SFC_SW_DWN'
    const url = `${NASA_POWER_URL}?parameters=${params}&community=RE&longitude=${lon}&latitude=${lat}&start=${startDate}&end=${endDate}&format=JSON`
    const response = await fetch(url)
    const data = await response.json()
    return data.properties?.parameter || null
  } catch (error) {
    console.error('Error fetching climate data:', error)
    return null
  }
}

// NASA GIBS tile URL generator for different satellite products
export const getSatelliteTileUrl = (product, date, zoom, x, y) => {
  // Format: YYYY-MM-DD
  return `${NASA_GIBS_URL}/${product}/default/${date}/250m/${zoom}/${y}/${x}.jpg`
}

// Available GIBS products
export const GIBS_PRODUCTS = {
  MODIS_TERRA_TRUE_COLOR: 'MODIS_Terra_CorrectedReflectance_TrueColor',
  MODIS_AQUA_TRUE_COLOR: 'MODIS_Aqua_CorrectedReflectance_TrueColor',
  VIIRS_TRUE_COLOR: 'VIIRS_SNPP_CorrectedReflectance_TrueColor',
  MODIS_TERRA_NDVI: 'MODIS_Terra_NDVI_8Day',
  MODIS_TERRA_LST_DAY: 'MODIS_Terra_Land_Surface_Temp_Day',
  MODIS_FIRES: 'MODIS_Terra_Thermal_Anomalies_Day',
  VIIRS_FIRES: 'VIIRS_SNPP_Thermal_Anomalies_375m_Day'
}

// Sentinel Hub - requires API key but we can show how to integrate
export const SENTINEL_HUB_INFO = {
  baseUrl: 'https://services.sentinel-hub.com',
  wmsUrl: 'https://services.sentinel-hub.com/ogc/wms',
  note: 'Requires API key from https://www.sentinel-hub.com/'
}

// Open Data Cube / STAC API endpoints
export const STAC_ENDPOINTS = {
  earthSearch: 'https://earth-search.aws.element84.com/v1',
  planetaryComputer: 'https://planetarycomputer.microsoft.com/api/stac/v1',
  copernicus: 'https://catalogue.dataspace.copernicus.eu/stac'
}

// Fetch STAC collections (available datasets)
export const fetchSTACCollections = async (endpoint = STAC_ENDPOINTS.earthSearch) => {
  try {
    const response = await fetch(`${endpoint}/collections`)
    const data = await response.json()
    return data.collections || []
  } catch (error) {
    console.error('Error fetching STAC collections:', error)
    return []
  }
}

// Search STAC items (actual satellite scenes)
export const searchSTACItems = async (endpoint, collectionId, bbox, datetime, limit = 10) => {
  try {
    // Ensure datetime is RFC3339 format if it contains a date range
    let formattedDatetime = datetime
    if (datetime && !datetime.includes('T')) {
      const parts = datetime.split('/')
      formattedDatetime = parts.map(d => d.includes('T') ? d : `${d}T00:00:00Z`).join('/')
    }
    
    const searchBody = {
      collections: [collectionId],
      limit,
      ...(bbox && { bbox }),
      ...(formattedDatetime && { datetime: formattedDatetime })
    }
    
    const response = await fetch(`${endpoint}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(searchBody)
    })
    const data = await response.json()
    return data.features || []
  } catch (error) {
    console.error('Error searching STAC items:', error)
    return []
  }
}

// Real-time spectral index calculation from actual data
export const calculateSpectralIndices = (bands) => {
  // These would use actual band values from satellite data
  // For demo, we show the formulas
  return {
    ndvi: {
      formula: '(NIR - Red) / (NIR + Red)',
      description: 'Normalized Difference Vegetation Index',
      range: [-1, 1],
      interpretation: {
        '-1 to 0': 'Water, bare soil, clouds',
        '0 to 0.2': 'Bare soil, rock',
        '0.2 to 0.4': 'Sparse vegetation',
        '0.4 to 0.6': 'Moderate vegetation',
        '0.6 to 1': 'Dense vegetation'
      }
    },
    ndwi: {
      formula: '(Green - NIR) / (Green + NIR)',
      description: 'Normalized Difference Water Index',
      range: [-1, 1]
    },
    ndbi: {
      formula: '(SWIR - NIR) / (SWIR + NIR)',
      description: 'Normalized Difference Built-up Index',
      range: [-1, 1]
    },
    evi: {
      formula: '2.5 * ((NIR - Red) / (NIR + 6*Red - 7.5*Blue + 1))',
      description: 'Enhanced Vegetation Index',
      range: [-1, 1]
    },
    nbr: {
      formula: '(NIR - SWIR2) / (NIR + SWIR2)',
      description: 'Normalized Burn Ratio',
      range: [-1, 1]
    }
  }
}

// Fetch real Sentinel-2 data info from AWS Earth Search
export const fetchSentinel2Data = async (bbox, startDate, endDate, cloudCover = 100) => {
  try {
    // Ensure dates are in RFC3339 format
    const startDt = startDate.includes('T') ? startDate : `${startDate}T00:00:00Z`
    const endDt = endDate.includes('T') ? endDate : `${endDate}T23:59:59Z`
    
    const response = await fetch('https://earth-search.aws.element84.com/v1/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        collections: ['sentinel-2-l2a'],
        bbox,
        datetime: `${startDt}/${endDt}`,
        query: {
          'eo:cloud_cover': { lt: cloudCover }
        },
        limit: 10,
        sortby: [{ field: 'properties.datetime', direction: 'desc' }]
      })
    })
    const data = await response.json()
    return data.features || []
  } catch (error) {
    console.error('Error fetching Sentinel-2 data:', error)
    return []
  }
}

// Fetch Landsat data from AWS Earth Search  
export const fetchLandsatData = async (bbox, startDate, endDate, cloudCover = 100) => {
  try {
    // Ensure dates are in RFC3339 format
    const startDt = startDate.includes('T') ? startDate : `${startDate}T00:00:00Z`
    const endDt = endDate.includes('T') ? endDate : `${endDate}T23:59:59Z`
    
    const response = await fetch('https://earth-search.aws.element84.com/v1/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        collections: ['landsat-c2-l2'],
        bbox,
        datetime: `${startDt}/${endDt}`,
        query: {
          'eo:cloud_cover': { lt: cloudCover }
        },
        limit: 10,
        sortby: [{ field: 'properties.datetime', direction: 'desc' }]
      })
    })
    const data = await response.json()
    return data.features || []
  } catch (error) {
    console.error('Error fetching Landsat data:', error)
    return []
  }
}

// Format satellite scene data for display
export const formatSceneData = (scene) => {
  if (!scene) return null
  
  return {
    id: scene.id,
    datetime: scene.properties?.datetime,
    cloudCover: scene.properties?.['eo:cloud_cover'],
    satellite: scene.properties?.['platform'],
    instrument: scene.properties?.['instruments']?.[0],
    sunElevation: scene.properties?.['view:sun_elevation'],
    bbox: scene.bbox,
    thumbnail: scene.assets?.thumbnail?.href,
    bands: Object.keys(scene.assets || {}).filter(k => 
      k.startsWith('B') || ['red', 'green', 'blue', 'nir', 'swir'].some(b => k.includes(b))
    )
  }
}
