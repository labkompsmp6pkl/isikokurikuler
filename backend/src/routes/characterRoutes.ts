import { Router } from 'express';
// Import nama fungsi yang BENAR sesuai controller di atas
import { getDailyLog, saveCharacterLog, getHistory } from '../controllers/characterController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// ============================================================================
// CATATAN:
// Frontend mengirim request ke: /api/character/log?date=YYYY-MM-DD
// Frontend halaman Riwayat mengirim request ke: /api/character/history
// ============================================================================

// 1. Get Log Harian (Bisa untuk hari ini atau tanggal tertentu via ?date=...)
// Menggantikan getTodayLog dan getLogByDate
router.get('/log', authMiddleware, getDailyLog);

// 2. Simpan atau Update Log (Rencana / Eksekusi)
// Menggantikan route '/save' agar sesuai RESTful (/log method POST)
// Frontend saya sebelumnya menggunakan POST ke /api/character/log
router.post('/log', authMiddleware, saveCharacterLog);

// 3. Get Semua Riwayat (Untuk Kalender)
router.get('/history', authMiddleware, getHistory);

export default router;