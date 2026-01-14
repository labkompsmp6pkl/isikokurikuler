import { Router, RequestHandler } from 'express'; 
import { 
    getCharacterLogs, 
    upsertCharacterLog, 
    getStudentDashboardData, 
    completeMission,
    getStudentMissions 
} from '../controllers/studentController';
import { authMiddleware, roleMiddleware } from '../middleware/authMiddleware';

const router = Router();

// 1. Middleware Authentication (Wajib Login)
router.use(authMiddleware as RequestHandler);

// 2. [FIX UTAMA] Middleware Role
// Izinkan 'student' DAN 'alumni' untuk mengakses route di bawah ini.
// Akses dashboard dan misi (GET) diperbolehkan untuk Alumni.
// Akses input data (POST) akan diblokir di level Controller dengan pesan khusus.
router.use(roleMiddleware(['student', 'alumni']) as RequestHandler);

// --- Routes ---

// Fitur Jurnal (Log Karakter)
router.get('/', getCharacterLogs as RequestHandler);
router.post('/', upsertCharacterLog as RequestHandler); 
// ^ Controller upsertCharacterLog akan cek: Jika Alumni -> Return 403 (Data Terkunci)

// Fitur Dashboard & Misi
router.get('/dashboard', getStudentDashboardData as RequestHandler);
router.get('/missions', getStudentMissions as RequestHandler);
router.post('/missions/complete', completeMission as RequestHandler);
// ^ Controller completeMission akan cek: Jika Alumni -> Return 403 (Tidak bisa selesaikan misi)

export default router;