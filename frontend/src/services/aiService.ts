import axios from 'axios';

// Menggunakan variabel lingkungan yang disuntikkan oleh Vite
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const aiApi = axios.create({
  baseURL: `${API_BASE_URL}/ai`
});

const getFeedback = (journalText: string) => {
  return aiApi.post('/feedback', { journalText });
};

export default {
  getFeedback,
};
