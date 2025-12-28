import { Router } from 'express';
import { getJournals, createJournal } from '../controllers/studentController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Semua rute di sini dilindungi dan hanya dapat diakses oleh pengguna yang login
router.use(authMiddleware);

router.get('/journals', getJournals);
router.post('/journals', createJournal);

export default router;
