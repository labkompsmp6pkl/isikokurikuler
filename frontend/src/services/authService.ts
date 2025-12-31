import axios from 'axios';

// Definisi Tipe Data
export interface RegistrationData {
  fullName: string;
  role: 'student' | 'teacher' | 'contributor' | 'parent';
  password?: string;
  nisn?: string;
  nip?: string;
  class?: string;
  whatsappNumber?: string;
}


export const API_HOST = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// Axios instance utama
const authApi = axios.create({
  // Selalu tambahkan '/api' di belakang host
  baseURL: `${API_HOST}/api`, 
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor (Opsional tapi disarankan): Tambahkan token otomatis jika ada
authApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const login = (loginIdentifier: string, password: string) => {
  // Akan memanggil: {API_HOST}/api/auth/login
  return authApi.post('/auth/login', { loginIdentifier, password });
};

const register = (data: RegistrationData) => {
  // Akan memanggil: {API_HOST}/api/auth/register
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