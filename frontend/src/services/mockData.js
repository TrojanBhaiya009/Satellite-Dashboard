// Mock satellite dataset for demo
// Individual satellite data - not combined/fused

export const mockDatasets = [
  {
    _id: 'dataset-1',
    name: '🌍 Amazon Rainforest - Deforestation Analysis',
    satellite: 'Sentinel-2',
    level: 'Level-2A',
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
    cloudCover: 12,
    resolution: '10m',
    bands: {
      'B02': { name: 'Blue', wavelength: '492.7 nm', resolution: '10m' },
      'B03': { name: 'Green', wavelength: '560.0 nm', resolution: '10m' },
      'B04': { name: 'Red', wavelength: '664.6 nm', resolution: '10m' },
      'B08': { name: 'NIR', wavelength: '835.1 nm', resolution: '10m' },
      'B11': { name: 'SWIR 1', wavelength: '1613.7 nm', resolution: '20m' },
      'B12': { name: 'SWIR 2', wavelength: '2202.4 nm', resolution: '20m' }
    },
    metadata: {
      source: 'Copernicus Data Space',
      downloadUrl: 'https://dataspace.copernicus.eu/',
      productId: 'S2A_MSIL2A_20240115',
      fileFormat: 'GeoTIFF'
    },
    extent: '100 km × 100 km',
    sources: [
      { name: 'Copernicus Open Access Hub', url: 'https://dataspace.copernicus.eu/browser/?zoom=10&lat=-4&lng=-70' },
      { name: 'AWS Open Data', url: 'https://registry.opendata.aws/sentinel-2/' },
      { name: 'Google Earth Engine', url: 'https://developers.google.com/earth-engine/datasets/catalog/COPERNICUS_S2_SR' }
    ]
  },
  {
    _id: 'dataset-2',
    name: '🔥 California Wildfire - Burn Assessment',
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
    cloudCover: 3,
    resolution: '30m',
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
      productId: 'LC09_L2SP_042034_20240210',
      fileFormat: 'GeoTIFF'
    },
    extent: '185 km × 180 km',
    sources: [
      { name: 'USGS Earth Explorer', url: 'https://earthexplorer.usgs.gov/' },
      { name: 'AWS Landsat', url: 'https://registry.opendata.aws/usgs-landsat/' },
      { name: 'Google Earth Engine', url: 'https://developers.google.com/earth-engine/datasets/catalog/LANDSAT_LC09_C02_T1_L2' }
    ]
  },
  {
    _id: 'dataset-3',
    name: '🏙️ Nile River Delta - Urban Expansion',
    satellite: 'MODIS',
    level: 'MOD09GA',
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
    cloudCover: 1,
    resolution: '500m',
    bands: {
      'B1': { name: 'Red', wavelength: '620-670 nm', resolution: '250m' },
      'B2': { name: 'NIR', wavelength: '841-876 nm', resolution: '250m' },
      'B3': { name: 'Blue', wavelength: '459-479 nm', resolution: '500m' },
      'B4': { name: 'Green', wavelength: '545-565 nm', resolution: '500m' },
      'B5': { name: 'SWIR 1', wavelength: '1230-1250 nm', resolution: '500m' },
      'B6': { name: 'SWIR 2', wavelength: '1628-1652 nm', resolution: '500m' }
    },
    metadata: {
      source: 'NASA LAADS DAAC',
      downloadUrl: 'https://ladsweb.modaps.eosdis.nasa.gov/',
      productId: 'MOD09GA_20240120',
      fileFormat: 'HDF'
    },
    extent: '1200 km × 1200 km',
    sources: [
      { name: 'NASA LAADS DAAC', url: 'https://ladsweb.modaps.eosdis.nasa.gov/search/order/1/MOD09GA' },
      { name: 'NASA Earthdata', url: 'https://search.earthdata.nasa.gov/search?q=MOD09GA' },
      { name: 'Google Earth Engine', url: 'https://developers.google.com/earth-engine/datasets/catalog/MODIS_061_MOD09GA' }
    ]
  },
  {
    _id: 'dataset-4',
    name: '❄️ Himalayan Glacier - Ice Monitoring',
    satellite: 'Sentinel-1',
    level: 'GRD',
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
    cloudCover: 0,
    resolution: '10m',
    bands: {
      'VV': { name: 'VV Polarization', frequency: 'C-band (5.4 GHz)', resolution: '10m' },
      'VH': { name: 'VH Polarization', frequency: 'C-band (5.4 GHz)', resolution: '10m' }
    },
    metadata: {
      source: 'Copernicus Data Space',
      downloadUrl: 'https://dataspace.copernicus.eu/',
      productId: 'S1A_IW_GRDH_20240110',
      fileFormat: 'GeoTIFF'
    },
    extent: '250 km × 250 km',
    sources: [
      { name: 'Copernicus Data Space', url: 'https://dataspace.copernicus.eu/browser/?zoom=8&lat=28&lng=87' },
      { name: 'Alaska Satellite Facility', url: 'https://search.asf.alaska.edu/#/?dataset=SENTINEL-1' },
      { name: 'Google Earth Engine', url: 'https://developers.google.com/earth-engine/datasets/catalog/COPERNICUS_S1_GRD' }
    ]
  },
  {
    _id: 'dataset-5',
    name: '🏙️ New York City - Urban Heat Island',
    satellite: 'VIIRS',
    level: 'VNP21A1D',
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
    cloudCover: 8,
    resolution: '375m',
    bands: {
      'I1': { name: 'I-Band 1', wavelength: '600-680 nm', resolution: '375m' },
      'I2': { name: 'I-Band 2', wavelength: '846-885 nm', resolution: '375m' },
      'I3': { name: 'I-Band 3 (SWIR)', wavelength: '1580-1640 nm', resolution: '375m' },
      'I4': { name: 'I-Band 4 (Thermal)', wavelength: '3.55-3.93 µm', resolution: '375m' },
      'I5': { name: 'I-Band 5 (Thermal)', wavelength: '10.5-12.4 µm', resolution: '375m' }
    },
    metadata: {
      source: 'NASA LAADS DAAC',
      downloadUrl: 'https://ladsweb.modaps.eosdis.nasa.gov/',
      productId: 'VNP21A1D_20240205',
      fileFormat: 'HDF5'
    },
    extent: '750 km × 750 km',
    sources: [
      { name: 'NASA LAADS DAAC', url: 'https://ladsweb.modaps.eosdis.nasa.gov/search/order/1/VNP21A1D' },
      { name: 'NASA Earthdata', url: 'https://search.earthdata.nasa.gov/search?q=VNP21A1D' },
      { name: 'NOAA CLASS', url: 'https://www.class.noaa.gov/saa/products/search?datatype_family=VIIRS' }
    ]
  }
]

// Unique analysis data for each dataset
export const analysisDataByDataset = {
  'dataset-1': {
    analysisType: 'Vegetation Health - Deforestation',
    results: {
      ndvi: [0.82, 0.79, 0.75, 0.71, 0.68, 0.64, 0.60, 0.55, 0.50, 0.45],
      ndbi: [0.08, 0.10, 0.12, 0.15, 0.18, 0.22, 0.28, 0.35, 0.42, 0.50],
      ndmi: [0.75, 0.72, 0.68, 0.64, 0.60, 0.55, 0.48, 0.40, 0.32, 0.25],
      ndwi: [0.42, 0.40, 0.38, 0.35, 0.30, 0.25, 0.18, 0.12, 0.08, 0.05],
      evi: [2.10, 2.05, 1.98, 1.88, 1.75, 1.60, 1.42, 1.25, 1.08, 0.90]
    },
    statistics: {
      ndviMean: 0.65,
      ndviMin: 0.45,
      ndviMax: 0.82,
      ndbiMean: 0.24,
      ndmiMean: 0.54,
      vegetationCover: '82.3%',
      deforestationRisk: 'HIGH',
      carbonContent: '312.5 Mg/ha'
    }
  },
  'dataset-2': {
    analysisType: 'Burn Severity Assessment',
    results: {
      ndvi: [0.12, 0.15, 0.20, 0.28, 0.38, 0.48, 0.55, 0.62, 0.68, 0.72],
      ndbi: [0.65, 0.60, 0.52, 0.45, 0.38, 0.30, 0.22, 0.15, 0.10, 0.08],
      nbr: [0.08, 0.12, 0.18, 0.25, 0.32, 0.40, 0.48, 0.55, 0.62, 0.68],
      bai: [0.85, 0.78, 0.68, 0.55, 0.42, 0.30, 0.20, 0.12, 0.08, 0.05],
      lst: [52.5, 50.2, 48.0, 45.5, 42.8, 40.2, 38.0, 36.2, 34.5, 33.0]
    },
    statistics: {
      ndviMean: 0.42,
      ndviMin: 0.12,
      ndviMax: 0.72,
      burnSeverity: 'SEVERE',
      burnedArea: '12,450 ha',
      recoveryPotential: 'MODERATE',
      estimatedRecovery: '5-8 years'
    }
  },
  'dataset-3': {
    analysisType: 'Urban Land Use Change',
    results: {
      ndvi: [0.35, 0.32, 0.28, 0.25, 0.22, 0.20, 0.18, 0.16, 0.14, 0.12],
      ndbi: [0.45, 0.48, 0.52, 0.55, 0.58, 0.62, 0.65, 0.68, 0.70, 0.72],
      ndwi: [0.55, 0.52, 0.48, 0.45, 0.42, 0.38, 0.35, 0.32, 0.28, 0.25],
      mndwi: [0.62, 0.58, 0.55, 0.52, 0.48, 0.45, 0.42, 0.38, 0.35, 0.32],
      savi: [0.42, 0.38, 0.35, 0.32, 0.28, 0.25, 0.22, 0.18, 0.15, 0.12]
    },
    statistics: {
      ndviMean: 0.22,
      ndviMin: 0.12,
      ndviMax: 0.35,
      urbanExpansion: '8.5% annually',
      agriculturalLoss: '2,340 ha/year',
      waterQuality: 'MODERATE',
      sedimentLoad: '125 mg/L'
    }
  },
  'dataset-4': {
    analysisType: 'Glacier Movement & Ice Mass',
    results: {
      coherence: [0.92, 0.88, 0.85, 0.82, 0.78, 0.75, 0.72, 0.68, 0.65, 0.62],
      backscatter: [-8.5, -9.2, -10.0, -10.8, -11.5, -12.2, -13.0, -13.8, -14.5, -15.2],
      displacement: [0.5, 1.2, 2.0, 2.8, 3.5, 4.2, 5.0, 5.8, 6.5, 7.2],
      velocity: [12.5, 14.2, 16.0, 18.5, 21.0, 24.5, 28.0, 32.0, 36.5, 42.0],
      elevation: [5420, 5380, 5340, 5300, 5260, 5220, 5180, 5140, 5100, 5060]
    },
    statistics: {
      coherenceMean: 0.77,
      avgDisplacement: '3.8 cm/year',
      glacierVelocity: '24.5 m/year',
      iceMassLoss: '-2.3 Gt/year',
      elevationChange: '-1.2 m/year',
      riskLevel: 'HIGH'
    }
  },
  'dataset-5': {
    analysisType: 'Urban Heat Island Effect',
    results: {
      lst: [38.5, 36.2, 34.0, 32.5, 30.8, 29.2, 28.0, 27.2, 26.5, 26.0],
      ndvi: [0.15, 0.18, 0.22, 0.28, 0.35, 0.42, 0.48, 0.52, 0.55, 0.58],
      ndbi: [0.68, 0.62, 0.55, 0.48, 0.40, 0.32, 0.25, 0.20, 0.15, 0.12],
      albedo: [0.12, 0.14, 0.16, 0.18, 0.20, 0.22, 0.25, 0.28, 0.32, 0.35],
      emissivity: [0.92, 0.93, 0.94, 0.95, 0.95, 0.96, 0.96, 0.97, 0.97, 0.98]
    },
    statistics: {
      lstMean: 30.9,
      lstMax: 38.5,
      lstMin: 26.0,
      uhiIntensity: '4.8°C',
      hotspotArea: '145 km²',
      greenCoverDeficit: '35%',
      coolingPotential: '2.5°C with 20% more vegetation'
    }
  }
}

export const mockAnalysis = [
  {
    _id: 'analysis-1',
    datasetId: 'dataset-1',
    analysisType: 'Vegetation Health',
    status: 'completed',
    progress: 100,
    ...analysisDataByDataset['dataset-1'],
    completedAt: new Date()
  },
  {
    _id: 'analysis-2',
    datasetId: 'dataset-2',
    analysisType: 'Burn Area Severity',
    status: 'completed',
    progress: 100,
    ...analysisDataByDataset['dataset-2'],
    completedAt: new Date()
  }
]
