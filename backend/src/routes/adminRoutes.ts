
import { Router } from 'express';
// [PERBAIKAN] Menggunakan middleware yang sudah distandardisasi
import { authMiddleware, roleMiddleware } from '../middleware/authMiddleware';
import {
  createUser, getUsers, updateUser, deleteUser, broadcastMessage, 
  getStudents, createStudent, updateStudent, deleteStudent
} from '../controllers/adminController';

const router = Router();

// [PERBAIKAN] Middleware otentikasi dan otorisasi untuk semua rute admin
router.use(authMiddleware);
router.use(roleMiddleware(['admin']));

// Rute manajemen pengguna umum
router.post('/users', createUser);
router.get('/users', getUsers);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// Rute manajemen siswa (untuk admin)
router.post('/students', createStudent);
router.get('/students', getStudents);
router.put('/students/:id', updateStudent);
router.delete('/students/:id', deleteStudent);

// Rute untuk mengirimkan broadcast
router.post('/broadcast', broadcastMessage);

export default router;
