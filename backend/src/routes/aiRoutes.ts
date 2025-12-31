import { Router } from 'express';
import { getAIFeedback, generateClassRecap } from '../controllers/aiController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Rute ini juga dilindungi
router.use(authMiddleware);

router.post('/feedback', getAIFeedback);
router.post('/class-recap', generateClassRecap);

export default router;
