import { Router, RequestHandler } from 'express';
import { 
    login, 
    register, 
    googleCallbackHandler, 
    completeGoogleRegistration,
    getStudentsList,
    getClasses // <<< PERBAIKAN: Impor dari authController
} from '../controllers/authController';
import passport from 'passport';
import { authMiddleware } from '../middleware/authMiddleware'; 

const router = Router();

// Auth Manual
router.post('/login', login as RequestHandler);
router.post('/register', register as RequestHandler);

// Mengambil daftar kelas untuk pendaftaran
router.get('/classes-list', getClasses as RequestHandler); // <<< PERBAIKAN: Sekarang menggunakan fungsi yang benar

// Auth Google
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }) as RequestHandler);

// Endpoint untuk admin mengambil daftar siswa (jika diperlukan)
router.get('/students-list', getStudentsList as RequestHandler);

// Callback setelah login Google berhasil
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }) as RequestHandler,
  googleCallbackHandler as RequestHandler
);

// Menyelesaikan pendaftaran setelah login Google
router.post(
    '/google/complete-register', 
    authMiddleware as RequestHandler, 
    completeGoogleRegistration as RequestHandler
);

export default router;