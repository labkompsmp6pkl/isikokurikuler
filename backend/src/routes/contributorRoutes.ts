import { Router, RequestHandler } from 'express'; // 1. Import RequestHandler
import { authMiddleware, roleMiddleware } from '../middleware/authMiddleware';
import { 
    getContributorData, 
    submitBehaviorScore, 
    assignMission, 
    getHistory 
} from '../controllers/contributorController';

const router = Router();

// Middleware
// FIX: Cast ke RequestHandler
router.use(authMiddleware as RequestHandler);
router.use(roleMiddleware(['contributor']) as RequestHandler);

// Routes
// FIX: Cast semua controller ke RequestHandler
router.get('/data', getContributorData as RequestHandler);
router.get('/history', getHistory as RequestHandler);
router.post('/score', submitBehaviorScore as RequestHandler);
router.post('/mission', assignMission as RequestHandler);

export default router;