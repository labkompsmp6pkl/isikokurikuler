import { Router } from 'express';
import { login, register, googleLogin, googleCallback } from '../controllers/authController';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.get('/google', googleLogin);
router.get('/google/callback', googleCallback);

export default router;
