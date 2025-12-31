
import { Router } from 'express';
import { 
    getDashboardData, 
    approveCharacterLog, 
    linkStudent, 
    getLogHistory,
    previewStudentByNisn // [FITUR BARU] Impor controller baru
} from '../controllers/parentController';
import { authMiddleware, roleMiddleware } from '../middleware/authMiddleware'; 

const router = Router();

// Mengambil data dasbor utama (log terbatas)
router.get(
    '/dashboard',
    authMiddleware, 
    roleMiddleware(['parent']),
    getDashboardData 
);

// [FITUR BARU] Mengambil seluruh riwayat log untuk kalender
router.get(
    '/log-history',
    authMiddleware,
    roleMiddleware(['parent']),
    getLogHistory
);

// Menyetujui sebuah log karakter
router.patch(
    '/approve/:logId',
    authMiddleware,
    roleMiddleware(['parent']),
    approveCharacterLog
);

// Menautkan akun orang tua ke siswa via NISN
router.post(
    '/link-student',
    authMiddleware,
    roleMiddleware(['parent']),
    linkStudent
);

router.post('/preview-student', authMiddleware, previewStudentByNisn); // Tambahkan baris ini

export default router;
