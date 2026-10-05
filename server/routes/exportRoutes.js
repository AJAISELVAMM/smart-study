import { Router } from 'express';
import { exportStudyPdf } from '../controllers/exportController.js';

const router = Router();
router.post('/pdf', exportStudyPdf);

export default router;
