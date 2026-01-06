import { Router, RequestHandler } from 'express';
import { 
    getDashboardData, 
    approveCharacterLog, 
    linkStudent, 
    getLogHistory,
    previewStudentByNisn,
    searchStudents // Pastikan ini terimport
} from '../controllers/parentController';
import { authMiddleware, roleMiddleware } from '../middleware/authMiddleware'; 

const router = Router();

// --- MIDDLEWARE GLOBAL UNTUK SEMUA RUTE PARENT ---
// Dengan ini, semua endpoint di bawah otomatis butuh Login & Role Parent
router.use(authMiddleware as RequestHandler);
router.use(roleMiddleware(['parent']) as RequestHandler);

// --- DEFINISI RUTE ---

// Dashboard & Data Utama
router.get('/dashboard', getDashboardData as RequestHandler);

// [PENTING] Fitur Pencarian Siswa (Yang tadi error)
router.get('/search-students', searchStudents as RequestHandler);

// Fitur Link Siswa
router.post('/link-student', linkStudent as RequestHandler);
router.post('/preview-student', previewStudentByNisn as RequestHandler);

// Fitur Jurnal & Log
router.get('/log-history', getLogHistory as RequestHandler);
router.patch('/approve/:logId', approveCharacterLog as RequestHandler);

export default router;