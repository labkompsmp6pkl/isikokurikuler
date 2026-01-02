import { Router, RequestHandler } from 'express'; // 1. Import RequestHandler
import { 
    getCharacterLogs, 
    upsertCharacterLog, 
    getStudentDashboardData, 
    completeMission 
} from '../controllers/studentController';
import { authMiddleware, roleMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Middleware
// FIX: Tambahkan 'as RequestHandler'
router.use(authMiddleware as RequestHandler);
router.use(roleMiddleware(['student']) as RequestHandler);

// Fitur Lama (Jurnal)
// FIX: Cast controller ke RequestHandler
router.get('/', getCharacterLogs as RequestHandler);
router.post('/', upsertCharacterLog as RequestHandler);

// Fitur Baru (Dashboard & Misi)
// FIX: Cast controller ke RequestHandler
router.get('/dashboard', getStudentDashboardData as RequestHandler);
router.post('/mission/complete', completeMission as RequestHandler);

export default router;