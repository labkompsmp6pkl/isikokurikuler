import axios from 'axios';

// Tipe data diekspor untuk digunakan di komponen lain
export interface RegistrationData {
  fullName: string;
  role: 'student' | 'teacher' | 'contributor' | 'parent';
  password?: string;
  nisn?: string;
  nip?: string;
  class?: string;
  whatsappNumber?: string;
  provider?: 'google';
  google_id?: string;
  email?: string;
}

// Menggunakan variabel lingkungan yang konsisten dengan layanan lain
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Membuat instance axios dengan baseURL yang benar dan lengkap untuk otentikasi
const authApi = axios.create({
  baseURL: `${API_BASE_URL}/api`
});

/**
 * Mengarahkan pengguna ke halaman login Google.
 * URL dibangun secara eksplisit untuk memastikan tidak ada kesalahan path.
 */
const googleLoginRedirect = () => {
  const origin = window.location.origin;
  // Pastikan URL redirect sama persis dengan yang diharapkan oleh backend
  window.location.href = `${API_BASE_URL}/api/auth/google?origin=${encodeURIComponent(origin)}`;
};

/**
 * Melakukan login dengan kredensial lokal (email/NISN/NIP/WA + password).
 */
const login = (loginIdentifier: string, password: string) => {
  // Path '/login' sudah benar karena baseURL sudah mengandung '/api/auth'
  return authApi.post('/auth/login', { loginIdentifier, password });
};

/**
 * Mendaftarkan pengguna baru, baik secara manual maupun dari data Google.
 */
const register = (data: RegistrationData) => {
  return authApi.post('/auth/register', data);
};

/**
 * Menghapus token dari local storage untuk logout.
 */
const logout = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('token');
};

export default {
  login,
  register,
  logout,
  googleLoginRedirect
};
