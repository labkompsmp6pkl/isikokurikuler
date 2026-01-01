import express from 'express';
import { authMiddleware, roleMiddleware } from '../middleware/authMiddleware'; // Sesuaikan nama import
import { getTeacherDashboard, validateLog, getClassHistory, generateStudentReport } from '../controllers/teacherController';

const router = express.Router();

// Gunakan middleware dengan nama yang benar
router.use(authMiddleware); 
router.use(roleMiddleware(['teacher'])); // Pastikan role 'teacher' sesuai dengan database

router.get('/dashboard', getTeacherDashboard);
router.patch('/validate/:logId', validateLog);
router.get('/history', getClassHistory);
router.post('/generate-report', generateStudentReport);

export default router;