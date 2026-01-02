import { Router } from 'express';
import { authMiddleware, roleMiddleware } from '../middleware/authMiddleware';
import { 
    getContributorData, 
    submitBehaviorScore, 
    assignMission, 
    getHistory 
} from '../controllers/contributorController';

const router = Router();

router.use(authMiddleware);
router.use(roleMiddleware(['contributor']));

router.get('/data', getContributorData);
router.get('/history', getHistory);
router.post('/score', submitBehaviorScore);
router.post('/mission', assignMission);

export default router;