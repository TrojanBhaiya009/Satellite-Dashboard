// Mock satellite dataset for demo
// Data structure based on Sentinel-2 Level-2A (Surface Reflectance)
// Sources: https://dataspace.copernicus.eu/ and https://registry.opendata.aws/sentinel-2/

export const mockDatasets = [
  {
    _id: 'dataset-1',
    name: '🌍 Amazon Rainforest - Deforestation Analysis',
    satellite: 'Sentinel-2',
    level: 'Level-2A (Surface Reflectance)',
    region: 'Brazil, South America',
    coordinates: {
      type: 'Polygon',
      coordinates: [[
        [-70.5, -3.5],
        [-70.5, -4.5],
        [-69.5, -4.5],
        [-69.5, -3.5],
        [-70.5, -3.5]
      ]]
    },
    acquisitionDate: new Date('2024-01-15'),
    cloudCover: 15,
    resolution: 10,
    // Sentinel-2 bands: RGB (B02, B03, B04) for visualization, B08 for NIR (vegetation analysis)
    bands: {
      'B02': { name: 'Blue', wavelength: '492.7 nm', resolution: '10m' },
      'B03': { name: 'Green', wavelength: '560.0 nm', resolution: '10m' },
      'B04': { name: 'Red', wavelength: '664.6 nm', resolution: '10m' },
      'B05': { name: 'Vegetation Red Edge', wavelength: '704.1 nm', resolution: '20m' },
      'B08': { name: 'NIR (Vegetation)', wavelength: '835.1 nm', resolution: '10m' },
      'B8A': { name: 'Vegetation Red Edge', wavelength: '864.7 nm', resolution: '20m' },
      'B11': { name: 'SWIR', wavelength: '1613.7 nm', resolution: '20m' },
      'B12': { name: 'SWIR', wavelength: '2202.4 nm', resolution: '20m' }
    },
    metadata: {
      source: 'Copernicus Data Space Ecosystem',
      downloadUrl: 'https://dataspace.copernicus.eu/',
      productId: 'S2A_MSIL2A_20240115T141031_N0510_R110_T19LDH',
      processingLevel: 'Level-2A',
      tileSize: '109.8 km',
      fileFormat: '.SAFE folder structure'
    }
  },
  {
    _id: 'dataset-2',
    name: '🔥 California Wildfire - Burn Area Assessment',
    satellite: 'Landsat-9',
    level: 'Collection 2 Level-2',
    region: 'California, USA',
    coordinates: {
      type: 'Polygon',
      coordinates: [[
        [-120.5, 38.5],
        [-120.5, 37.5],
        [-119.5, 37.5],
        [-119.5, 38.5],
        [-120.5, 38.5]
      ]]
    },
    acquisitionDate: new Date('2024-02-10'),
    cloudCover: 5,
    resolution: 30,
    bands: {
      'B1': { name: 'Coastal/Aerosol', wavelength: '442 nm', resolution: '30m' },
      'B2': { name: 'Blue', wavelength: '480 nm', resolution: '30m' },
      'B3': { name: 'Green', wavelength: '561 nm', resolution: '30m' },
      'B4': { name: 'Red', wavelength: '654 nm', resolution: '30m' },
      'B5': { name: 'NIR', wavelength: '865 nm', resolution: '30m' },
      'B6': { name: 'SWIR 1', wavelength: '1609 nm', resolution: '30m' },
      'B7': { name: 'SWIR 2', wavelength: '2201 nm', resolution: '30m' }
    },
    metadata: {
      source: 'USGS Earth Explorer',
      downloadUrl: 'https://earthexplorer.usgs.gov/',
      productId: 'LC09_L2SP_042034_20240210_02_T1',
      collection: 'Collection 2',
      processingLevel: 'Level-2',
      acquisitionTime: '18:47:35 UTC',
      fileFormat: 'GeoTIFF'
    }
  },
  {
    _id: 'dataset-3',
    name: '🏙️ Nile River Delta - Urban Expansion',
    satellite: 'Sentinel-2',
    level: 'Level-2A (Surface Reflectance)',
    region: 'Egypt, North Africa',
    coordinates: {
      type: 'Polygon',
      coordinates: [[
        [30.5, 31.5],
        [30.5, 30.5],
        [31.5, 30.5],
        [31.5, 31.5],
        [30.5, 31.5]
      ]]
    },
    acquisitionDate: new Date('2024-01-20'),
    cloudCover: 2,
    resolution: 10,
    bands: {
      'B02': { name: 'Blue', wavelength: '492.7 nm', resolution: '10m' },
      'B03': { name: 'Green', wavelength: '560.0 nm', resolution: '10m' },
      'B04': { name: 'Red', wavelength: '664.6 nm', resolution: '10m' },
      'B05': { name: 'Vegetation Red Edge', wavelength: '704.1 nm', resolution: '20m' },
      'B08': { name: 'NIR (Vegetation)', wavelength: '835.1 nm', resolution: '10m' },
      'B11': { name: 'SWIR', wavelength: '1613.7 nm', resolution: '20m' },
      'B12': { name: 'SWIR', wavelength: '2202.4 nm', resolution: '20m' }
    },
    metadata: {
      source: 'Copernicus Data Space Ecosystem',
      downloadUrl: 'https://dataspace.copernicus.eu/',
      productId: 'S2A_MSIL2A_20240120T082641_N0510_R063_T36RUU',
      processingLevel: 'Level-2A',
      dataProvider: 'European Space Agency (ESA)'
    }
  },
  {
    _id: 'dataset-4',
    name: '❄️ Himalayan Glacier - Climate Change Impact',
    satellite: 'Sentinel-2',
    level: 'Level-2A (Surface Reflectance)',
    region: 'Nepal/Tibet Border',
    coordinates: {
      type: 'Polygon',
      coordinates: [[
        [86.5, 28.5],
        [86.5, 27.5],
        [87.5, 27.5],
        [87.5, 28.5],
        [86.5, 28.5]
      ]]
    },
    acquisitionDate: new Date('2024-01-10'),
    cloudCover: 30,
    resolution: 10,
    bands: {
      'B02': { name: 'Blue', wavelength: '492.7 nm', resolution: '10m' },
      'B03': { name: 'Green', wavelength: '560.0 nm', resolution: '10m' },
      'B04': { name: 'Red', wavelength: '664.6 nm', resolution: '10m' },
      'B08': { name: 'NIR (Vegetation)', wavelength: '835.1 nm', resolution: '10m' },
      'B11': { name: 'SWIR', wavelength: '1613.7 nm', resolution: '20m' },
      'B12': { name: 'SWIR', wavelength: '2202.4 nm', resolution: '20m' }
    },
    metadata: {
      source: 'Copernicus Data Space Ecosystem',
      downloadUrl: 'https://dataspace.copernicus.eu/',
      productId: 'S2A_MSIL2A_20240110_N0510_R110_T45RWK',
      processingLevel: 'Level-2A'
    }
  },
  {
    _id: 'dataset-5',
    name: '🏙️ New York City - Urban Heat Island',
    satellite: 'Landsat-9',
    level: 'Collection 2 Level-2',
    region: 'New York, USA',
    coordinates: {
      type: 'Polygon',
      coordinates: [[
        [-74.5, 41.0],
        [-74.5, 40.5],
        [-74.0, 40.5],
        [-74.0, 41.0],
        [-74.5, 41.0]
      ]]
    },
    acquisitionDate: new Date('2024-02-05'),
    cloudCover: 10,
    resolution: 30,
    bands: {
      'B1': { name: 'Coastal/Aerosol', wavelength: '442 nm', resolution: '30m' },
      'B2': { name: 'Blue', wavelength: '480 nm', resolution: '30m' },
      'B3': { name: 'Green', wavelength: '561 nm', resolution: '30m' },
      'B4': { name: 'Red', wavelength: '654 nm', resolution: '30m' },
      'B5': { name: 'NIR', wavelength: '865 nm', resolution: '30m' },
      'B10': { name: 'Thermal IR', wavelength: '10.9 µm', resolution: '100m' }
    },
    metadata: {
      source: 'USGS Earth Explorer',
      downloadUrl: 'https://earthexplorer.usgs.gov/',
      productId: 'LC09_L2SP_013032_20240205_02_T1',
      collection: 'Collection 2',
      processingLevel: 'Level-2',
      fileFormat: 'GeoTIFF'
    }
  }
]

export const mockAnalysis = [
  {
    _id: 'analysis-1',
    datasetId: 'dataset-1',
    analysisType: 'Vegetation Health',
    status: 'completed',
    progress: 100,
    results: {
      ndvi: [0.72, 0.71, 0.69, 0.65, 0.58, 0.52, 0.48, 0.45, 0.42, 0.38],
      ndbi: [0.12, 0.14, 0.16, 0.22, 0.28, 0.35, 0.42, 0.48, 0.55, 0.62],
      ndmi: [0.68, 0.67, 0.65, 0.62, 0.58, 0.52, 0.45, 0.38, 0.32, 0.25],
      ndwi: [0.35, 0.33, 0.30, 0.25, 0.18, 0.12, 0.08, 0.05, 0.02, 0.0],
      evi: [1.85, 1.82, 1.78, 1.70, 1.58, 1.42, 1.28, 1.15, 1.02, 0.88]
    },
    statistics: {
      ndviMean: 0.60,
      ndviMin: 0.38,
      ndviMax: 0.72,
      ndbiMean: 0.33,
      ndmiMean: 0.54,
      vegetationCover: '78.5%',
      deforestationRisk: 'HIGH',
      carbonContent: '245.3 Mg/ha'
    },
    completedAt: new Date()
  },
  {
    _id: 'analysis-2',
    datasetId: 'dataset-2',
    analysisType: 'Burn Area Severity',
    status: 'completed',
    progress: 100,
    results: {
      ndvi: [0.15, 0.18, 0.22, 0.28, 0.35, 0.42, 0.50, 0.58, 0.65, 0.70],
      ndbi: [0.55, 0.52, 0.48, 0.42, 0.35, 0.28, 0.22, 0.15, 0.10, 0.05],
      ndmi: [0.12, 0.15, 0.20, 0.28, 0.35, 0.42, 0.50, 0.58, 0.65, 0.72],
      ndwi: [0.08, 0.10, 0.15, 0.22, 0.30, 0.38, 0.45, 0.52, 0.60, 0.68],
      evi: [0.28, 0.35, 0.45, 0.58, 0.72, 0.88, 1.05, 1.25, 1.48, 1.72]
    },
    statistics: {
      ndviMean: 0.41,
      ndviMin: 0.15,
      ndviMax: 0.70,
      burnSeverity: 'MODERATE',
      recoveryPotential: 'HIGH',
      barenessIndex: 0.52,
      expectedRecoveryTime: '3-5 years'
    },
    completedAt: new Date()
  }
]
