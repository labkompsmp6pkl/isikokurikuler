import axios from 'axios';

// Tentukan tipe data yang lebih detail untuk registrasi
interface RegistrationData {
  fullName: string;
  email?: string; // Email bersifat opsional karena Orang Tua menggunakan nomor WhatsApp
  password: string;
  role: 'student' | 'teacher' | 'contributor' | 'parent' | 'admin';
  nisn?: string;
  nip?: string;
  class?: string;
  whatsappNumber?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const authApi = axios.create({
  baseURL: `${API_BASE_URL}/auth`
});

// Fungsi untuk login
const login = (email: string, password: string) => {
  return authApi.post('/login', { email, password });
};

// Fungsi untuk mendaftar (diperbarui)
const register = (data: RegistrationData) => {
  // Mengirimkan objek data lengkap ke backend
  return authApi.post('/register', data);
};

// Fungsi untuk logout
const logout = () => {
  // Implementasi logout, misalnya menghapus token dari local storage
  localStorage.removeItem('user'); // Sebaiknya hapus token JWT jika disimpan
  localStorage.removeItem('token');
};

export default {
  login,
  register,
  logout,
};
