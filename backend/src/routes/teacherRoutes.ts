import { Router, RequestHandler } from 'express';
import { authMiddleware, roleMiddleware } from '../middleware/authMiddleware'; 
import { 
    getTeacherDashboard, 
    validateLog, 
    getClassHistory, 
    generateAIReport,     // [UPDATE] Menggantikan generateStudentReport
    saveReportData,       // [BARU] Untuk menyimpan draft rapor
    getStudentReportData, // [BARU] Untuk memuat draft rapor
    getStudentParents,
    promoteStudents
} from '../controllers/teacherController';

const router = Router();

// Middleware Auth & Role
router.use(authMiddleware as RequestHandler); 
router.use(roleMiddleware(['teacher']) as RequestHandler);

// --- ROUTES DASHBOARD & JURNAL ---
router.get('/dashboard', getTeacherDashboard as RequestHandler);
router.patch('/validate/:logId', validateLog as RequestHandler);
router.get('/history', getClassHistory as RequestHandler);

// --- ROUTES RAPOR & AI (BARU) ---
router.post('/generate-report', generateAIReport as RequestHandler); // Generate narasi via OpenRouter
router.post('/save-report', saveReportData as RequestHandler);       // Simpan input manual (Eskul/Absensi)
router.get('/get-report-data', getStudentReportData as RequestHandler); // Ambil data tersimpan

// --- ROUTES MANAJEMEN SISWA ---
router.get('/students/:studentId/parents', getStudentParents as RequestHandler);
router.post('/promote-students', promoteStudents as RequestHandler);

export default router;