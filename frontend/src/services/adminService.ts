import axios from 'axios';

const API_URL = 'https://backendkokurikuler.smpn6pekalongan.org/api/admin';

// Definisikan tipe untuk data siswa
interface StudentData {
  name: string;
  email: string;
  password?: string; // opsional, hanya untuk pembuatan
}

// Fungsi untuk mendapatkan semua siswa
const getStudents = () => {
  return axios.get(`${API_URL}/students`);
};

// Fungsi untuk membuat siswa baru
const createStudent = (studentData: StudentData) => {
  return axios.post(`${API_URL}/students`, studentData);
};

// Fungsi untuk memperbarui siswa
const updateStudent = (id: number | string, studentData: StudentData) => {
  return axios.put(`${API_URL}/students/${id}`, studentData);
};

// Fungsi untuk menghapus siswa
const deleteStudent = (id: number | string) => {
  return axios.delete(`${API_URL}/students/${id}`);
};

export default {
  getStudents,
  createStudent,
  updateStudent,
  deleteStudent,
};
