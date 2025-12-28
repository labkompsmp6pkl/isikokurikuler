import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  createUser, getUsers, updateUser, deleteUser, broadcastMessage, 
  getStudents, createStudent, updateStudent, deleteStudent // Impor fungsi baru
} from '../controllers/adminController';

const router = Router();

// Middleware otentikasi dan otorisasi untuk semua rute admin
router.use(authenticate);
router.use(authorize(['admin']));

// Rute manajemen pengguna umum
router.post('/users', createUser);
router.get('/users', getUsers);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// Rute broadcast
router.post('/broadcast', broadcastMessage);

// Rute CRUD khusus untuk siswa
router.get('/students', getStudents);
router.post('/students', createStudent);     // Rute untuk membuat siswa
router.put('/students/:id', updateStudent); // Rute untuk memperbarui siswa
router.delete('/students/:id', deleteStudent); // Rute untuk menghapus siswa

export default router;
