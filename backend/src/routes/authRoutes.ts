import { Router, RequestHandler } from 'express'; // 1. Import RequestHandler
import { 
    login, 
    register, 
    googleCallbackHandler, 
    completeGoogleRegistration 
} from '../controllers/authController';
import passport from 'passport';
import { authMiddleware } from '../middleware/authMiddleware'; 
import { getClasses } from '../controllers/adminController';

const router = Router();

// Auth Manual
// Tambahkan 'as RequestHandler' untuk menghindari error tipe pada req/res
router.post('/login', login as RequestHandler);
router.post('/register', register as RequestHandler);
router.get('/classes-list', getClasses as RequestHandler);
// Auth Google
// 1. Redirect ke Google
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }) as RequestHandler);

// 2. Callback Handler
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }) as RequestHandler,
  googleCallbackHandler as RequestHandler
);

// 3. API Submit Data Lengkap
// PENTING: Tambahkan 'as RequestHandler' pada middleware dan controller
router.post(
    '/google/complete-register', 
    authMiddleware as RequestHandler, // <--- PERBAIKAN UTAMA DI SINI
    completeGoogleRegistration as RequestHandler // <--- Controller juga di-cast agar aman
);

export default router;