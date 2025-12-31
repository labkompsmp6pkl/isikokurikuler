import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor untuk menyisipkan Token JWT otomatis
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

// Interface untuk Preview Siswa (Sebelum ditautkan)
export interface StudentPreviewData {
  fullName: string;
  class: string;
}

// Interface informasi siswa setelah login/linked
export interface StudentInfo {
    id: number;
    full_name: string;
    class: string;
}

// Interface untuk Log Karakter
export interface CharacterLog {
    id: number;
    student_id: number;
    log_date: string; 
    status: 'Tersimpan' | 'Disetujui' | 'Disahkan'; // Sesuaikan dengan Enum Database
    wake_up_time: string;
    sleep_time: string;
    worship_activities: string[]; // Frontend mengharapkan array
    worship_notes?: string;
    exercise_type?: string;
    exercise_details?: string;
    healthy_food_notes?: string;
    learning_subject?: string;
    learning_details?: string;
    social_activity_notes?: string;
}

// Interface Response Dashboard Utama
export interface ParentDashboardData {
    student: StudentInfo;
    logs: CharacterLog[];
}

// --- [LAYANAN API] --- //

// 1. Ambil Data Dashboard (Siswa & Log Pending)
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

// 2. Preview Siswa berdasarkan NISN (BARU DITAMBAHKAN)
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

// 3. Tautkan Akun Orang Tua dengan Siswa (Link)
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

// 4. Setujui Log Karakter
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

// 5. Ambil Riwayat Log Lengkap
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
  getStudentPreview, // Pastikan ini diexport
  linkStudent,
  approveLog,
  getLogHistory,
};

export default parentService;