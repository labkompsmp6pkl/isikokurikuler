import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const API_URL = `${API_BASE_URL}/api/character`;

// Helper untuk Header Auth
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

// ==========================================
// 1. GET LOG (Harian / Tanggal Tertentu)
// ==========================================
// Mengambil data log berdasarkan tanggal.
// Backend: GET /api/character/log?date=YYYY-MM-DD
const getLogByDate = async (date: string) => {
  try {
    const response = await axios.get(`${API_URL}/log`, {
      ...getAuthHeaders(),
      params: { date } // Mengirim tanggal sebagai query param
    });
    return response.data; // Mengembalikan object log atau null
  } catch (error: any) {
    console.error("Error fetching log:", error);
    throw error;
  }
};

// ==========================================
// 2. SAVE LOG (Rencana & Eksekusi)
// ==========================================
// Menyimpan data.
// Backend: POST /api/character/log
// Payload harus berisi: { mode: 'plan' | 'execution', log_date, ...data }
const saveCharacterLog = async (logData: any) => {
  try {
    const response = await axios.post(`${API_URL}/log`, logData, getAuthHeaders());
    return response.data;
  } catch (error: any) {
    console.error("Error saving log:", error);
    throw error;
  }
};

// ==========================================
// 3. GET HISTORY (Untuk Kalender)
// ==========================================
// Mengambil semua riwayat untuk ditampilkan di kalender.
// Backend: GET /api/character/history
const getHistory = async () => {
  try {
    const response = await axios.get(`${API_URL}/history`, getAuthHeaders());
    return response.data; // Mengembalikan array of logs
  } catch (error: any) {
    console.error("Error fetching history:", error);
    throw error;
  }
};

const characterService = {
  getLogByDate,
  saveCharacterLog,
  getHistory
};

export default characterService;