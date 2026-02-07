import Analysis from '../models/Analysis.js';
import { io } from '../server.js';

const calculateSpectralIndices = (bands) => {
  const results = {
    ndvi: Array.from({ length: 256 }, () => Math.random() * 0.8 + 0.2),
    ndbi: Array.from({ length: 256 }, () => Math.random() * 0.6),
    ndmi: Array.from({ length: 256 }, () => Math.random() * 0.7 + 0.1),
    ndwi: Array.from({ length: 256 }, () => Math.random() * 0.8),
    evi: Array.from({ length: 256 }, () => Math.random() * 0.9 + 0.1),
    statistics: {
      mean: 0.52,
      std: 0.18,
      min: 0.1,
      max: 0.95,
      median: 0.55
    }
  };
  return results;
};

const simulateProcessing = async (analysis, userId) => {
  for (let i = 0; i <= 100; i += 10) {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await Analysis.findByIdAndUpdate(
      analysis._id,
      { progress: i }
    );

    io.to(`user_${userId}`).emit('analysis_progress', {
      analysisId: analysis._id,
      progress: i
    });
  }
};

export const createAnalysis = async (req, res) => {
  try {
    const { datasetId, type, parameters } = req.body;

    const analysis = new Analysis({
      datasetId,
      userId: req.user.id,
      type,
      parameters,
      status: 'pending',
      startedAt: new Date()
    });

    await analysis.save();

    io.to(`user_${req.user.id}`).emit('analysis_created', {
      analysisId: analysis._id,
      status: 'processing'
    });

    // Simulate processing in background
    setImmediate(async () => {
      try {
        await Analysis.findByIdAndUpdate(analysis._id, {
          status: 'processing'
        });

        await simulateProcessing(analysis, req.user.id);

        const results = calculateSpectralIndices({});

        await Analysis.findByIdAndUpdate(analysis._id, {
          status: 'completed',
          results,
          progress: 100,
          completedAt: new Date()
        });

        io.to(`user_${req.user.id}`).emit('analysis_completed', {
          analysisId: analysis._id,
          status: 'completed',
          results
        });
      } catch (error) {
        await Analysis.findByIdAndUpdate(analysis._id, {
          status: 'failed',
          error: error.message
        });

        io.to(`user_${req.user.id}`).emit('analysis_failed', {
          analysisId: analysis._id,
          error: error.message
        });
      }
    });

    res.status(201).json(analysis);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAnalyses = async (req, res) => {
  try {
    const analyses = await Analysis.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(analyses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAnalysis = async (req, res) => {
  try {
    const analysis = await Analysis.findById(req.params.id).populate('datasetId');

    if (!analysis || analysis.userId.toString() !== req.user.id) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    res.json(analysis);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteAnalysis = async (req, res) => {
  try {
    const analysis = await Analysis.findById(req.params.id);

    if (!analysis || analysis.userId.toString() !== req.user.id) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    await Analysis.findByIdAndDelete(req.params.id);

    res.json({ message: 'Analysis deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAnalysisByDataset = async (req, res) => {
  try {
    const analyses = await Analysis.find({
      datasetId: req.params.datasetId,
      userId: req.user.id
    }).sort({ createdAt: -1 });

    res.json(analyses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
