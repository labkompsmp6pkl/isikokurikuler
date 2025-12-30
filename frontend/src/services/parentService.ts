
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export interface StudentInfo {
  id: number;
  fullName: string;
  class: string;
}

export interface CharacterLog {
  id: number;
  log_date: string;
  status: 'Tersimpan' | 'Disetujui';
  wake_up_time: string;
  worship_activities: string[];
  worship_notes: string;
  exercise_type: string;
  exercise_details: string;
  healthy_food_notes: string;
  learning_subject: string;
  learning_details: string;
  social_activity_notes: string;
  sleep_time: string;
}

export interface ParentDashboardData {
  student: StudentInfo;
  logs: CharacterLog[];
}

const getDashboardData = async (): Promise<ParentDashboardData> => {
  try {
    const response = await apiClient.get<ParentDashboardData>('/api/parent/dashboard');
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Gagal mengambil data dasbor.');
    } else {
        throw new Error('Terjadi kesalahan yang tidak terduga.');
    }
  }
};

// --- [PENAMBAHAN] FUNGSI UNTUK MENGIRIM PERSETUJUAN LOG ---
const approveLog = async (logId: number): Promise<{ message: string }> => {
    try {
        const response = await apiClient.patch(`/api/parent/approve/${logId}`);
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            throw new Error(error.response.data.message || 'Gagal menyetujui log.');
        } else {
            throw new Error('Terjadi kesalahan yang tidak terduga saat menyetujui log.');
        }
    }
};

const parentService = {
  getDashboardData,
  approveLog, // <-- Ekspor fungsi baru
};

export default parentService;
