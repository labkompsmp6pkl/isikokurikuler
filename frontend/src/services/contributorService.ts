import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const API_URL = `${API_BASE_URL}/api/contributor`;

// Helper untuk mengambil token
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

// 1. Ambil Data Dropdown (Siswa & Kelas)
const getData = async () => {
  try {
    const response = await axios.get(`${API_URL}/data`, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error("Error fetching contributor data:", error);
    throw error;
  }
};

// 2. Ambil Riwayat Aktivitas
const getHistory = async () => {
  try {
    const response = await axios.get(`${API_URL}/history`, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error("Error fetching history:", error);
    throw error;
  }
};

// 3. Kirim Penilaian Sikap (Manual)
const submitScore = async (data: any) => {
  try {
    const response = await axios.post(`${API_URL}/score`, data, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error("Error submitting score:", error);
    throw error;
  }
};

// 4. Jadwalkan Misi (Manual - Deprecated/Optional)
const assignMission = async (data: any) => {
  try {
    const response = await axios.post(`${API_URL}/mission`, data, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error("Error assigning mission:", error);
    throw error;
  }
};

// 5. Buat Jadwal Misi Berulang (Target Misi) - BARU
const createMissionSchedule = async (data: any) => {
  try {
    const response = await axios.post(`${API_URL}/mission-schedule`, data, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error("Error creating mission schedule:", error);
    throw error;
  }
};

const contributorService = {
  getData,
  getHistory,
  submitScore,
  assignMission,
  createMissionSchedule // Export fungsi baru
};

export default contributorService;