import Dataset from '../models/Dataset.js';

export const createDataset = async (req, res) => {
  try {
    const { name, satellite, region, acquisitionDate, cloudCover, resolution, bands, metadata } = req.body;

    const dataset = new Dataset({
      userId: req.user.id,
      name,
      satellite,
      region,
      acquisitionDate,
      cloudCover,
      resolution,
      bands,
      metadata,
      imageUrl: `https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=800&h=600&fit=crop`,
      fileSize: Math.floor(Math.random() * 500) + 100
    });

    await dataset.save();

    res.status(201).json(dataset);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getDatasets = async (req, res) => {
  try {
    const datasets = await Dataset.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(datasets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getDataset = async (req, res) => {
  try {
    const dataset = await Dataset.findById(req.params.id);

    if (!dataset || dataset.userId.toString() !== req.user.id) {
      return res.status(404).json({ error: 'Dataset not found' });
    }

    res.json(dataset);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateDataset = async (req, res) => {
  try {
    let dataset = await Dataset.findById(req.params.id);

    if (!dataset || dataset.userId.toString() !== req.user.id) {
      return res.status(404).json({ error: 'Dataset not found' });
    }

    dataset = await Dataset.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    res.json(dataset);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteDataset = async (req, res) => {
  try {
    const dataset = await Dataset.findById(req.params.id);

    if (!dataset || dataset.userId.toString() !== req.user.id) {
      return res.status(404).json({ error: 'Dataset not found' });
    }

    await Dataset.findByIdAndDelete(req.params.id);

    res.json({ message: 'Dataset deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const searchDatasets = async (req, res) => {
  try {
    const { satellite, minCloudCover, maxCloudCover, startDate, endDate } = req.query;

    const filter = { userId: req.user.id };

    if (satellite) filter.satellite = satellite;
    if (minCloudCover !== undefined || maxCloudCover !== undefined) {
      filter.cloudCover = {};
      if (minCloudCover !== undefined) filter.cloudCover.$gte = Number(minCloudCover);
      if (maxCloudCover !== undefined) filter.cloudCover.$lte = Number(maxCloudCover);
    }
    if (startDate || endDate) {
      filter.acquisitionDate = {};
      if (startDate) filter.acquisitionDate.$gte = new Date(startDate);
      if (endDate) filter.acquisitionDate.$lte = new Date(endDate);
    }

    const datasets = await Dataset.find(filter).sort({ createdAt: -1 });

    res.json(datasets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
