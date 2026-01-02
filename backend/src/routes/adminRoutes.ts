import { Router } from 'express';
import { authMiddleware, roleMiddleware } from '../middleware/authMiddleware'; 
import { getAdminDashboardStats, generateNationalAnalysis,
    getUsers,       // Baru
    getUserById,    // Baru
    createUser,     // Baru
    updateUser,     // Baru
    deleteUser,      // Baru
    getClasses, createClass, generateClasses, updateClass, deleteClass, getClassDetail, getTeachersList,
    setupClassDatabase
 } from '../controllers/adminController';

const router = Router();

// Middleware: Hanya Admin yang boleh akses
router.use(authMiddleware);
router.get('/classes', getClasses);
router.get('/teachers-list', getTeachersList);
router.use(roleMiddleware(['admin']));

// Route Dashboard Statistik
router.get('/dashboard-stats', getAdminDashboardStats);
router.post('/generate-analysis', generateNationalAnalysis);

router.get('/users', getUsers);
router.get('/users/:id', getUserById);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

router.post('/classes', createClass);
router.post('/classes/setup', setupClassDatabase); // <--- Route Baru untuk Fix Database
router.post('/classes/generate', generateClasses);
router.put('/classes/:id', updateClass);
router.delete('/classes/:id', deleteClass);
router.get('/classes/:id', getClassDetail);
router.get('/teachers-list', getTeachersList);

export default router;