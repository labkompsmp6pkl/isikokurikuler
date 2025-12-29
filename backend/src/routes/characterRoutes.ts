import { Router } from 'express';
import { getTodayLog, saveCharacterLog, getLogHistory, getLogByDate } from '../controllers/characterController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Rute untuk mendapatkan log hari ini jika ada.
// Tidak akan membuat entri baru jika tidak ada.
router.get('/today', authMiddleware, getTodayLog);

// Rute untuk menyimpan atau memperbarui progres pencatatan karakter.
// Ini akan membuat entri jika belum ada, atau memperbarui jika sudah ada.
router.post('/save', authMiddleware, saveCharacterLog);

// Rute untuk mendapatkan riwayat singkat (tanggal & status) untuk tampilan kalender.
router.get('/history', authMiddleware, getLogHistory);

// Rute untuk mendapatkan detail log lengkap berdasarkan tanggal.
router.get('/log/:date', authMiddleware, getLogByDate);

export default router;
