import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const API_URL = `${API_BASE_URL}/api/character`;
const STUDENT_URL = `${API_BASE_URL}/api/student`;

// Helper untuk Header Auth
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

// 1. GET LOG (Harian / Tanggal Tertentu)
const getLogByDate = async (date: string) => {
  try {
    const response = await axios.get(`${API_URL}/log`, {
      ...getAuthHeaders(),
      params: { date }
    });
    return response.data;
  } catch (error: any) {
    console.error("Error fetching log:", error);
    throw error;
  }
};

// 2. SAVE LOG (Rencana & Eksekusi)
const saveCharacterLog = async (logData: any) => {
  try {
    const response = await axios.post(`${API_URL}/log`, logData, getAuthHeaders());
    return response.data;
  } catch (error: any) {
    console.error("Error saving log:", error);
    throw error;
  }
};

// 3. GET HISTORY (Untuk Kalender)
const getHistory = async () => {
  try {
    const response = await axios.get(`${API_URL}/history`, getAuthHeaders());
    return response.data;
  } catch (error: any) {
    console.error("Error fetching history:", error);
    throw error;
  }
};

// 4. GET DASHBOARD DATA (Profile, Stats, Habits)
const getStudentDashboard = async () => {
  try {
      const response = await axios.get(`${STUDENT_URL}/dashboard`, getAuthHeaders());
      return response.data;
  } catch (error) {
      console.error("Error dashboard:", error);
      return null;
  }
};

// 5. GET DAILY MISSIONS (BARU - Misi Harian dari Guru/Kontributor)
const getStudentMissions = async () => {
  try {
      const response = await axios.get(`${STUDENT_URL}/missions`, getAuthHeaders());
      return response.data;
  } catch (error) {
      console.error("Error fetching missions:", error);
      throw error;
  }
};

// 6. COMPLETE MISSION (Menyelesaikan Misi)
const completeMission = async (scheduleId: number) => {
  try {
      // Payload disesuaikan: { scheduleId }
      await axios.post(`${STUDENT_URL}/missions/complete`, { scheduleId }, getAuthHeaders());
      return true;
  } catch (error) {
      console.error("Error completing mission:", error);
      throw error;
  }
};

const characterService = {
  getLogByDate,
  saveCharacterLog,
  getHistory,
  getStudentDashboard,
  getStudentMissions, // Export fungsi baru
  completeMission
};

export default characterService;