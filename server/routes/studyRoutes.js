import { Router } from 'express';
import { generateStudy, getStudy, uploadStudyPdf } from '../controllers/studyController.js';
import { uploadPdf } from '../middleware/uploadMiddleware.js';

const router = Router();
router.post('/upload', uploadPdf, uploadStudyPdf);
router.post('/generate', uploadPdf, generateStudy);
router.get('/:id', getStudy);

export default router;
