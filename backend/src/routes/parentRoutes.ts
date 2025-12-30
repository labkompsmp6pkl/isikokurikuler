
import { Router } from 'express';
import { getDashboardData, approveCharacterLog } from '../controllers/parentController';
// [PERBAIKAN] Path yang benar ke folder 'middleware'
import { authMiddleware, roleMiddleware } from '../middleware/authMiddleware'; 

const router = Router();

router.get(
    '/dashboard',
    authMiddleware, 
    roleMiddleware(['parent']),
    getDashboardData 
);

router.patch(
    '/approve/:logId',
    authMiddleware,
    roleMiddleware(['parent']),
    approveCharacterLog
);

export default router;
