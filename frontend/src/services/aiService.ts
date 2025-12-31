import axios from 'axios';

// Menggunakan variabel lingkungan yang disuntikkan oleh Vite
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Kita perlu menambahkan header Authorization manual jika axios instance ini belum memilikinya
// Asumsi: Token disimpan di localStorage dengan key 'token'
const getToken = () => localStorage.getItem('token');

const aiApi = axios.create({
  baseURL: `${API_BASE_URL}/api/ai`
});

// Interceptor untuk menyisipkan token di setiap request
aiApi.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const getFeedback = (journalText: string) => {
  return aiApi.post('/feedback', { journalText });
};

// Update: Hanya kirim startDate dan endDate
const generateClassRecap = (startDate: string, endDate: string) => {
  return aiApi.post('/class-recap', { startDate, endDate });
};

export default {
  getFeedback,
  generateClassRecap,
};