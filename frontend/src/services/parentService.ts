
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

// --- [PERBAIKAN] Definisi Tipe Data yang Benar --- //

export interface StudentInfo {
    id: number;
    fullName: string;
    class: string;
}

export interface CharacterLog {
    id: number;
    student_id: number;
    log_date: string; // Tanggal dalam format string (misal: "2023-10-27T00:00:00.000Z")
    status: 'Tersimpan' | 'Disetujui';
    wake_up_time: string;
    sleep_time: string;
    worship_activities: string[]; // Ini adalah array of strings
    worship_notes?: string;
    exercise_type?: string;
    exercise_details?: string;
    healthy_food_notes?: string;
    learning_subject?: string;
    learning_details?: string;
    social_activity_notes?: string;
}

export interface ParentDashboardData {
    student: StudentInfo;
    logs: CharacterLog[];
}

// --- Definisi Layanan API --- //

const getDashboardData = async (): Promise<ParentDashboardData> => {
  try {
    const response = await apiClient.get<ParentDashboardData>('/api/parent/dashboard');
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
        throw error;
    } else {
        throw new Error('Kesalahan tak terduga saat mengambil data dasbor.');
    }
  }
};

// [PERBAIKAN] Tipe kembalian yang benar untuk approveLog
const approveLog = async (logId: number): Promise<{ message: string; log: CharacterLog }> => {
    try {
        const response = await apiClient.patch(`/api/parent/approve/${logId}`);
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            throw error;
        } else {
            throw new Error('Kesalahan tak terduga saat menyetujui log.');
        }
    }
};

const linkStudent = async (nisn: string): Promise<{ message: string; student: StudentInfo }> => {
    try {
        const response = await apiClient.post('/api/parent/link-student', { nisn });
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            throw error; 
        } else {
            throw new Error('Kesalahan tak terduga saat menautkan siswa.');
        }
    }
};

const getLogHistory = async (): Promise<CharacterLog[]> => {
    try {
        const response = await apiClient.get<CharacterLog[]>('/api/parent/log-history');
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            throw error;
        } else {
            throw new Error('Gagal mengambil riwayat log dari server.');
        }
    }
};

const parentService = {
  getDashboardData,
  approveLog,
  linkStudent,
  getLogHistory,
};

export default parentService;
