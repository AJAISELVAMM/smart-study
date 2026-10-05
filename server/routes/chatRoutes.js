import { Router } from 'express';
import { askStudyQuestion } from '../controllers/chatController.js';

const router = Router();
router.post('/', askStudyQuestion);

export default router;
