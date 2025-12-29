import axios from 'axios';

// Menggunakan variabel lingkungan yang disuntikkan oleh Vite
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const adminApi = axios.create({
  baseURL: `${API_BASE_URL}/admin`
});

// Definisikan tipe untuk data siswa
interface StudentData {
  name: string;
  email: string;
  password?: string; // opsional, hanya untuk pembuatan
}

// Fungsi untuk mendapatkan semua siswa
const getStudents = () => {
  return adminApi.get('/students');
};

// Fungsi untuk membuat siswa baru
const createStudent = (studentData: StudentData) => {
  return adminApi.post('/students', studentData);
};

// Fungsi untuk memperbarui siswa
const updateStudent = (id: number | string, studentData: StudentData) => {
  return adminApi.put(`/students/${id}`, studentData);
};

// Fungsi untuk menghapus siswa
const deleteStudent = (id: number | string) => {
  return adminApi.delete(`/students/${id}`);
};

export default {
  getStudents,
  createStudent,
  updateStudent,
  deleteStudent,
};
