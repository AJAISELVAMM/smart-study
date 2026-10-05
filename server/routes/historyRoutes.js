import { Router } from 'express';
import { getHistoryEntry, listHistory, removeAllHistory, removeHistoryEntry } from '../controllers/historyController.js';

const router = Router();
router.get('/', listHistory);
router.get('/:id', getHistoryEntry);
router.delete('/', removeAllHistory);
router.delete('/:id', removeHistoryEntry);

export default router;
