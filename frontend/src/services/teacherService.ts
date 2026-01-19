import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Interceptor untuk Token Auth
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers['Authorization'] = `Bearer ${token}`;
    return config;
});

// --- API ACTIONS ---

const getStudentParents = async (studentId: number) => {
  const response = await apiClient.get(`/api/teacher/students/${studentId}/parents`);
  return response.data;
};

const getDashboard = async () => (await apiClient.get('/api/teacher/dashboard')).data;

// Validasi Satu Jurnal
const validateLog = async (logId: number) => (await apiClient.patch(`/api/teacher/validate/${logId}`)).data;

// [BARU] Validasi Massal (Bulk Approve)
const validateBulkLogs = async (logIds: number[]) => {
    // Karena backend belum memiliki endpoint bulk khusus, kita gunakan Promise.all
    // untuk mengirim request validate per item secara paralel.
    const promises = logIds.map(id => 
        apiClient.patch(`/api/teacher/validate/${id}`)
    );
    const results = await Promise.all(promises);
    return results.map(r => r.data);
};

const getClassHistory = async (studentId?: string) => (await apiClient.get('/api/teacher/history', { params: { studentId } })).data;

const generateReport = async (payload: { studentId: number, startDate: string, endDate: string }) => 
    (await apiClient.post('/api/teacher/generate-report', payload)).data;

const getValidationLogs = async () => (await apiClient.get('/api/teacher/validation-logs')).data;

// Promosi / Kenaikan Kelas
const promoteStudents = async (payload: { studentIds: number[], targetClassId: number | null, isAlumni: boolean }) => 
    (await apiClient.post('/api/teacher/promote-students', payload)).data;

// Helper ambil semua kelas (untuk dropdown promote)
const getAllClasses = async () => (await apiClient.get('/api/auth/classes-list')).data;

export default { 
    getDashboard, 
    validateLog, 
    validateBulkLogs, // Export fungsi baru ini
    getClassHistory, 
    generateReport, 
    getValidationLogs,
    getStudentParents,
    promoteStudents, 
    getAllClasses    
};