import mongoose from 'mongoose';

const datasetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  satellite: {
    type: String,
    enum: ['Sentinel-2', 'Landsat-8', 'Landsat-9', 'ISRO-Cartosat'],
    required: true
  },
  region: {
    type: {
      type: String,
      enum: ['Polygon'],
      default: 'Polygon'
    },
    coordinates: {
      type: [[[Number]]],
      required: true
    }
  },
  acquisitionDate: {
    type: Date,
    required: true
  },
  cloudCover: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  resolution: {
    type: String,
    enum: ['10m', '15m', '30m', '60m'],
    required: true
  },
  bands: {
    type: Map,
    of: String
  },
  imageUrl: String,
  metadata: {
    type: Map,
    of: String
  },
  status: {
    type: String,
    enum: ['processing', 'completed', 'failed'],
    default: 'completed'
  },
  fileSize: Number,
  processingTime: Number,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for geospatial queries
datasetSchema.index({ region: '2dsphere' });
datasetSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model('Dataset', datasetSchema);
