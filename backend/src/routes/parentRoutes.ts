import { Router, RequestHandler } from 'express'; // 1. Import RequestHandler
import { 
    getDashboardData, 
    approveCharacterLog, 
    linkStudent, 
    getLogHistory,
    previewStudentByNisn 
} from '../controllers/parentController';
import { authMiddleware, roleMiddleware } from '../middleware/authMiddleware'; 

const router = Router();

// Mengambil data dasbor utama (log terbatas)
router.get(
    '/dashboard',
    authMiddleware as RequestHandler, 
    roleMiddleware(['parent']) as RequestHandler,
    getDashboardData as RequestHandler
);

// [FITUR BARU] Mengambil seluruh riwayat log untuk kalender
router.get(
    '/log-history',
    authMiddleware as RequestHandler,
    roleMiddleware(['parent']) as RequestHandler,
    getLogHistory as RequestHandler
);

// Menyetujui sebuah log karakter
router.patch(
    '/approve/:logId',
    authMiddleware as RequestHandler,
    roleMiddleware(['parent']) as RequestHandler,
    approveCharacterLog as RequestHandler
);

// Menautkan akun orang tua ke siswa via NISN
router.post(
    '/link-student',
    authMiddleware as RequestHandler,
    roleMiddleware(['parent']) as RequestHandler,
    linkStudent as RequestHandler
);

// Preview Nama Siswa berdasarkan NISN (Cek sebelum link)
router.post(
    '/preview-student', 
    authMiddleware as RequestHandler, 
    previewStudentByNisn as RequestHandler
);

export default router;