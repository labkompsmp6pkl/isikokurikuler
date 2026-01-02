import { Router, RequestHandler } from 'express'; // 1. Import RequestHandler
import { authMiddleware, roleMiddleware } from '../middleware/authMiddleware'; 
import { 
    getTeacherDashboard, 
    validateLog, 
    getClassHistory, 
    generateStudentReport 
} from '../controllers/teacherController';

const router = Router();

// Middleware
// FIX: Cast ke RequestHandler
router.use(authMiddleware as RequestHandler); 
router.use(roleMiddleware(['teacher']) as RequestHandler);

// Routes
// FIX: Cast controller ke RequestHandler
router.get('/dashboard', getTeacherDashboard as RequestHandler);
router.patch('/validate/:logId', validateLog as RequestHandler);
router.get('/history', getClassHistory as RequestHandler);
router.post('/generate-report', generateStudentReport as RequestHandler);

export default router;