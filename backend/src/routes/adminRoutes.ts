import { Router, RequestHandler } from 'express'; // 1. Pastikan import RequestHandler
import { authMiddleware, roleMiddleware } from '../middleware/authMiddleware'; 
import { 
    getAdminDashboardStats, generateNationalAnalysis,
    getUsers, getUserById, createUser, updateUser, deleteUser,
    getClasses, createClass, generateClasses, updateClass, deleteClass, getClassDetail, getTeachersList,
    setupClassDatabase
} from '../controllers/adminController';

const router = Router();

// ==================================================================
// 1. GLOBAL AUTH (Semua route di file ini butuh login)
// ==================================================================
// FIX: Tambahkan 'as RequestHandler' untuk mengatasi error TS2769
router.use(authMiddleware as RequestHandler);

// ==================================================================
// 2. PUBLIC / COMMON ROUTES (Login User Tapi Bukan Admin Bisa Akses)
// ==================================================================
// Route ini ditaruh SEBELUM roleMiddleware agar user biasa/guru bisa akses (jika memang diizinkan)
router.get('/classes', getClasses as RequestHandler);
router.get('/teachers-list', getTeachersList as RequestHandler);

// ==================================================================
// 3. ADMIN ONLY ROUTES (Gerbang Khusus Admin)
// ==================================================================
// FIX: Tambahkan 'as RequestHandler' di sini juga
router.use(roleMiddleware(['admin']) as RequestHandler);

// --- Dashboard & Stats ---
router.get('/dashboard-stats', getAdminDashboardStats as RequestHandler);
router.post('/generate-analysis', generateNationalAnalysis as RequestHandler);

// --- User Management ---
router.get('/users', getUsers as RequestHandler);
router.get('/users/:id', getUserById as RequestHandler);
router.post('/users', createUser as RequestHandler);
router.put('/users/:id', updateUser as RequestHandler);
router.delete('/users/:id', deleteUser as RequestHandler);

// --- Class Management ---
router.post('/classes', createClass as RequestHandler);
router.post('/classes/setup', setupClassDatabase as RequestHandler);
router.post('/classes/generate', generateClasses as RequestHandler);
router.put('/classes/:id', updateClass as RequestHandler);
router.delete('/classes/:id', deleteClass as RequestHandler);
router.get('/classes/:id', getClassDetail as RequestHandler);


export default router;