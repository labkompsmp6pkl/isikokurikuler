import axios from 'axios';

const API_URL = 'https://backendkokurikuler.smpn6pekalongan.org/api/auth/';

// Fungsi untuk login
const login = (email: string, password: string) => {
  return axios.post(API_URL + 'login', { email, password });
};

// Fungsi untuk mendaftar (jika diperlukan)
const register = ({ name, email, password }: { name: string, email: string, password: string }) => {
  return axios.post(API_URL + 'register', { name, email, password });
};

// Fungsi untuk logout
const logout = () => {
  // Implementasi logout, misalnya menghapus token dari local storage
  localStorage.removeItem('user');
};

export default {
  login,
  register,
  logout,
};
