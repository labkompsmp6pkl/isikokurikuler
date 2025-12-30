import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const API_URL = `${API_BASE_URL}/character`;

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

// Mendapatkan log karakter untuk hari ini, jika ada.
// Berbeda dari sebelumnya, fungsi ini tidak akan menyebabkan pembuatan log baru di backend.
const getTodayLog = async () => {
  try {
    const response = await axios.get(`${API_URL}/today`, getAuthHeaders());
    return response.data; // Mengembalikan data log jika ada
  } catch (error: any) {
    if (error.response && error.response.status === 404) {
      return null; // Mengembalikan null jika log belum ada (ini kondisi normal)
    }
    throw error; // Melempar error lainnya untuk ditangani di komponen
  }
};

// Menyimpan progres karakter. Akan membuat atau memperbarui.
const saveCharacterLog = async (logData: any) => {
  const response = await axios.post(`${API_URL}/save`, logData, getAuthHeaders());
  return response.data;
};

// Mengambil riwayat log untuk kalender
const getLogHistory = async (month: number, year: number) => {
  const response = await axios.get(`${API_URL}/history?month=${month}&year=${year}`, getAuthHeaders());
  return response.data;
};

// Mengambil detail log berdasarkan tanggal
const getLogByDate = async (date: string) => {
  const response = await axios.get(`${API_URL}/log/${date}`, getAuthHeaders());
  return response.data;
};

const characterService = {
  getTodayLog, // <-- Diperbarui
  saveCharacterLog,
  getLogHistory,
  getLogByDate,
};

export default characterService;
