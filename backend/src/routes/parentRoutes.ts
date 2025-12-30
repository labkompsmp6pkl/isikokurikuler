
import { Router } from 'express';
import { getDashboardData, approveCharacterLog, linkStudent } from '../controllers/parentController';
import { authMiddleware, roleMiddleware } from '../middleware/authMiddleware'; 

const router = Router();

// Rute yang ada untuk mengambil data dasbor
router.get(
    '/dashboard',
    authMiddleware, 
    roleMiddleware(['parent']),
    getDashboardData 
);

// Rute yang ada untuk menyetujui log karakter
router.patch(
    '/approve/:logId',
    authMiddleware,
    roleMiddleware(['parent']),
    approveCharacterLog
);

// [FITUR BARU] Rute untuk menautkan akun orang tua ke siswa
router.post(
    '/link-student',
    authMiddleware, // Memastikan pengguna sudah login
    roleMiddleware(['parent']), // Memastikan hanya orang tua yang bisa mengakses
    linkStudent // Menghubungkan ke fungsi controller yang baru
);

export default router;
