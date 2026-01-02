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
  (error) => Promise.reject(error)
);

// --- [DEFINISI TIPE DATA] --- //

export interface StudentPreviewData {
  fullName: string;
  class: string; 
}

export interface StudentInfo {
    id: number;
    full_name: string;
    // Kita tambahkan opsi opsional agar TypeScript tidak error saat mapping
    class?: string;      
    class_name?: string; 
    classId?: number | string;
    student_class?: string;
}

export interface CharacterLog {
    social_activity_notes: string | undefined;
    learning_details: string | undefined;
    healthy_food_notes: string | undefined;
    exercise_details: string | undefined;
    id: number;
    student_id: number;
    log_date: string; 
    status: 'Tersimpan' | 'Disetujui' | 'Disahkan'; 
    wake_up_time: string;
    sleep_time: string;
    worship_activities: string[] | string;
    worship_detail?: string;
    sport_activities?: string;
    sport_detail?: string;
    meal_text?: string;
    study_activities?: string[] | string;
    study_detail?: string;
    social_activities?: string[] | string; 
    social_detail?: string;
}

export interface ParentDashboardData {
    student: StudentInfo;
    logs: CharacterLog[];
}

// --- [LAYANAN API] --- //

const getDashboardData = async (): Promise<ParentDashboardData> => {
  try {
    const response = await apiClient.get<ParentDashboardData>('/api/parent/dashboard');
    
    // LOGIKA PERBAIKAN: Jika field 'class' kosong, kita cari di field lain
    if (response.data.student) {
        const s = response.data.student;
        // Fallback: Gunakan class_name atau student_class jika 'class' undefined
        response.data.student.class = s.class || s.class_name || s.student_class || "-";
    }
    
    return response.data;
  } catch (error) {
    throw error;
  }
};

const getStudentPreview = async (nisn: string): Promise<StudentPreviewData> => {
    const response = await apiClient.post<StudentPreviewData>('/api/parent/preview-student', { nisn });
    return response.data;
};

const linkStudent = async (nisn: string): Promise<{ message: string; student: StudentInfo }> => {
    const response = await apiClient.post('/api/parent/link-student', { nisn });
    return response.data;
};

const approveLog = async (logId: number): Promise<{ message: string; log: CharacterLog }> => {
    const response = await apiClient.patch(`/api/parent/approve/${logId}`);
    return response.data;
};

const getLogHistory = async (): Promise<CharacterLog[]> => {
    const response = await apiClient.get<CharacterLog[]>('/api/parent/log-history');
    return response.data;
};

const parentService = {
  getDashboardData,
  getStudentPreview,
  linkStudent,
  approveLog,
  getLogHistory,
};

export default parentService;