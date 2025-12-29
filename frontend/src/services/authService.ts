import axios from 'axios';

// Tentukan tipe data yang lebih detail untuk registrasi
interface RegistrationData {
  fullName: string;
  password: string;
  role: 'student' | 'teacher' | 'contributor' | 'parent';
  nisn?: string;
  nip?: string;
  class?: string;
  whatsappNumber?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const authApi = axios.create({
  baseURL: `${API_BASE_URL}/auth`
});

// --- PERBAIKAN DI SINI ---
// Fungsi login diperbarui untuk mengirim 'loginIdentifier' agar sesuai dengan backend.
const login = (loginIdentifier: string, password: string) => {
  return authApi.post('/login', { loginIdentifier, password });
};

// Fungsi untuk mendaftar (sudah benar, tidak ada perubahan)
const register = (data: RegistrationData) => {
  return authApi.post('/register', data);
};

// Fungsi untuk logout
const logout = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('token');
};

export default {
  login,
  register,
  logout,
};
