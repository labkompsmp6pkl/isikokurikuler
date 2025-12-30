import axios from 'axios';

// Tipe data diperbarui untuk mengakomodasi pendaftaran via Google dan diekspor
export interface RegistrationData {
  fullName: string;
  role: 'student' | 'teacher' | 'contributor' | 'parent';
  password?: string; // Dijadikan opsional karena tidak ada saat daftar dengan Google
  nisn?: string;
  nip?: string;
  class?: string;
  whatsappNumber?: string;
  provider?: 'google'; // Opsional, untuk menandakan pendaftaran via Google
  google_id?: string;   // Opsional, ID Google pengguna
  email?: string;       // Opsional, email dari Google
}

// Menggunakan VITE_API_URL yang konsisten
const API_URL = import.meta.env.VITE_API_BASE_URL;

const authApi = axios.create({
  // Mengatur base URL yang benar untuk endpoint otentikasi
  baseURL: `${API_URL}/auth`
});

// Fungsi login tetap sama
const login = (loginIdentifier: string, password: string) => {
  return authApi.post('/login', { loginIdentifier, password });
};

// Fungsi register sekarang menerima data yang lebih fleksibel
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
