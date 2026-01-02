import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

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

// --- [DEFINISI TIPE DATA] --- //

export interface StudentPreviewData {
  fullName: string;
  class: string;
}

export interface StudentInfo {
    id: number;
    full_name: string;
    class: string;
}

export interface CharacterLog {
    social_activity_notes: string | undefined;
    healthy_food_notes: string | undefined;
    learning_details: string;
    exercise_details: string;
    id: number;
    student_id: number;
    log_date: string; 
    status: 'Tersimpan' | 'Disetujui' | 'Disahkan'; 
    wake_up_time: string;
    sleep_time: string;
    
    // Perbaikan: Menyesuaikan dengan kolom database baru
    worship_activities: string[] | string; // Bisa string JSON atau array
    worship_detail?: string;               // Menggantikan worship_notes
    
    sport_activities?: string;             // Menggantikan exercise_type
    sport_detail?: string;                 // Menggantikan exercise_details
    
    meal_text?: string;                    // Menggantikan healthy_food_notes
    
    study_activities?: string[] | string;  // Menggantikan learning_subject
    study_detail?: string;                 // Menggantikan learning_details
    
    social_activities?: string[] | string; 
    social_detail?: string;                // Menggantikan social_activity_notes
    
    is_execution_submitted?: boolean;
}

export interface ParentDashboardData {
    student: StudentInfo;
    logs: CharacterLog[];
}

// --- [LAYANAN API] --- //

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

const getStudentPreview = async (nisn: string): Promise<StudentPreviewData> => {
    try {
        const response = await apiClient.post<StudentPreviewData>('/api/parent/preview-student', { nisn });
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            throw error; 
        } else {
            throw new Error('Gagal mencari data siswa.');
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
  getStudentPreview,
  linkStudent,
  approveLog,
  getLogHistory,
};

export default parentService;