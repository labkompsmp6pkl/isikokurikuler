import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers['Authorization'] = `Bearer ${token}`;
    return config;
});

const getStudentParents = async (studentId: number) => {
  const response = await apiClient.get(`/api/teacher/students/${studentId}/parents`);
  return response.data;
};

const getDashboard = async () => (await apiClient.get('/api/teacher/dashboard')).data;

const validateLog = async (logId: number) => (await apiClient.patch(`/api/teacher/validate/${logId}`)).data;

const getClassHistory = async (studentId?: string) => (await apiClient.get('/api/teacher/history', { params: { studentId } })).data;

const generateReport = async (payload: { studentId: number, startDate: string, endDate: string }) => 
    (await apiClient.post('/api/teacher/generate-report', payload)).data;

const getValidationLogs = async () => (await apiClient.get('/api/teacher/validation-logs')).data;

// [NEW] Function for Student Promotion
const promoteStudents = async (payload: { studentIds: number[], targetClassId: number | null, isAlumni: boolean }) => 
    (await apiClient.post('/api/teacher/promote-students', payload)).data;

// [NEW] Helper to get all classes (to select target class)
const getAllClasses = async () => (await apiClient.get('/api/auth/classes-list')).data;

export default { 
    getDashboard, 
    validateLog, 
    getClassHistory, 
    generateReport, 
    getValidationLogs,
    getStudentParents,
    promoteStudents, // Export here
    getAllClasses    // Export here
};