import { Router } from 'express';
import { getAIFeedback } from '../controllers/aiController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Rute ini juga dilindungi
router.use(authMiddleware);

router.post('/feedback', getAIFeedback);

export default router;
