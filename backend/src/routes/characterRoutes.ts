import { Router, RequestHandler } from 'express'; // 1. Import RequestHandler
import { getDailyLog, saveCharacterLog, getHistory } from '../controllers/characterController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// ============================================================================
// CATATAN:
// Frontend mengirim request ke: /api/character/log?date=YYYY-MM-DD
// Frontend halaman Riwayat mengirim request ke: /api/character/history
// ============================================================================

// 1. Get Log Harian (Bisa untuk hari ini atau tanggal tertentu via ?date=...)
router.get(
    '/log', 
    authMiddleware as RequestHandler, 
    getDailyLog as RequestHandler
);

// 2. Simpan atau Update Log (Rencana / Eksekusi)
router.post(
    '/log', 
    authMiddleware as RequestHandler, 
    saveCharacterLog as RequestHandler
);

// 3. Get Semua Riwayat (Untuk Kalender)
router.get(
    '/history', 
    authMiddleware as RequestHandler, 
    getHistory as RequestHandler
);

export default router;