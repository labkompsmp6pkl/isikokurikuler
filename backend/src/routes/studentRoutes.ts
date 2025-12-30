
import { Router } from 'express';
// [PERBAIKAN] Mengimpor fungsi yang benar dari controller
import { getCharacterLogs, upsertCharacterLog } from '../controllers/studentController';
import { authMiddleware, roleMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Semua rute siswa memerlukan login sebagai 'student'
router.use(authMiddleware);
router.use(roleMiddleware(['student']));

// [PERBAIKAN] Menggunakan fungsi getCharacterLogs untuk GET
router.get(
    '/',
    getCharacterLogs
);

// [PERBAIKAN] Menggunakan fungsi upsertCharacterLog untuk POST (membuat/memperbarui)
router.post(
    '/',
    upsertCharacterLog
);

export default router;
