import express from 'express';
import {
  createDataset,
  getDatasets,
  getDataset,
  updateDataset,
  deleteDataset,
  searchDatasets
} from '../controllers/datasets.js';

const router = express.Router();

router.post('/', createDataset);
router.get('/', getDatasets);
router.get('/search', searchDatasets);
router.get('/:id', getDataset);
router.put('/:id', updateDataset);
router.delete('/:id', deleteDataset);

export default router;
