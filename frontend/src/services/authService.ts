import axios from 'axios';

// Definisi Tipe Data (tetap sama)
export interface RegistrationData {
  fullName: string;
  role: 'student' | 'teacher' | 'contributor' | 'parent';
  password?: string;
  nisn?: string;
  nip?: string;
  class?: string;
  whatsappNumber?: string;
}

// [PERBAIKAN] Gunakan string kosong '' sebagai default agar Proxy Vite bekerja
export const API_HOST = import.meta.env.VITE_API_BASE_URL || ''; 

// Axios instance utama
const authApi = axios.create({
  // Jika API_HOST kosong, baseURL menjadi '/api'. 
  // Vite akan melihat '/api' dan meneruskannya ke backend (sesuai setting proxy).
  baseURL: `${API_HOST}/api`, 
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor (Opsional tapi disarankan)
authApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- SERVICE METHODS (Tetap sama) ---

const login = (loginIdentifier: string, password: string) => {
  return authApi.post('/auth/login', { loginIdentifier, password });
};

const register = (data: RegistrationData) => {
  return authApi.post('/auth/register', data);
};

const logout = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  window.location.href = '/login';
};

export default {
  login,
  register,
  logout,
  API_HOST 
};