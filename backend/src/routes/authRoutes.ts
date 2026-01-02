import { Router } from 'express';
import { 
    login, 
    register, 
    googleCallbackHandler, 
    completeGoogleRegistration 
} from '../controllers/authController';
import passport from 'passport';
import { authMiddleware } from '../middleware/authMiddleware'; // Pastikan path ini benar

const router = Router();

// Auth Manual
router.post('/login', login);
router.post('/register', register);

// Auth Google
// 1. Redirect ke Google
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
  '/google/callback',
  // session: false SANGAT PENTING jika Anda menggunakan JWT manual di controller
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  googleCallbackHandler
);

// 3. API Submit Data Lengkap (Frontend memanggil ini)
// PENTING: Tambahkan 'authMiddleware' agar req.user terisi dari token sementara
router.post(
    '/google/complete-register', // Samakan path dengan Frontend
    authMiddleware, 
    completeGoogleRegistration
);

export default router;