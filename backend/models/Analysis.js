import mongoose from 'mongoose';

const analysisSchema = new mongoose.Schema({
  datasetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dataset',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['spectral-indices', 'change-detection', 'anomaly-detection', 'classification'],
    required: true
  },
  parameters: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  results: {
    ndvi: [Number],
    ndbi: [Number],
    ndmi: [Number],
    ndwi: [Number],
    evi: [Number],
    statistics: {
      mean: Number,
      std: Number,
      min: Number,
      max: Number,
      median: Number
    },
    classification: Map,
    anomalies: [Object]
  },
  visualizationData: {
    heatmap: String,
    histogram: Object,
    colorMap: String
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  error: String,
  startedAt: Date,
  completedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

analysisSchema.index({ userId: 1, datasetId: 1, createdAt: -1 });
analysisSchema.index({ status: 1 });

export default mongoose.model('Analysis', analysisSchema);
