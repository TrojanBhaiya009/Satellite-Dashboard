import express from 'express';
import {
  createAnalysis,
  getAnalyses,
  getAnalysis,
  deleteAnalysis,
  getAnalysisByDataset
} from '../controllers/analysis.js';

const router = express.Router();

router.post('/', createAnalysis);
router.get('/', getAnalyses);
router.get('/:id', getAnalysis);
router.delete('/:id', deleteAnalysis);
router.get('/dataset/:datasetId', getAnalysisByDataset);

export default router;
