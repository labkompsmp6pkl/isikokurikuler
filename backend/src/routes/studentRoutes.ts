import { Router } from 'express';
// Import fungsi lama dan baru
import { getCharacterLogs, upsertCharacterLog, getStudentDashboardData, completeMission } from '../controllers/studentController';
import { authMiddleware, roleMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.use(authMiddleware);
router.use(roleMiddleware(['student']));

// Fitur Lama (Jurnal)
router.get('/', getCharacterLogs);
router.post('/', upsertCharacterLog);

// Fitur Baru (Dashboard & Misi)
router.get('/dashboard', getStudentDashboardData);
router.post('/mission/complete', completeMission);

export default router;