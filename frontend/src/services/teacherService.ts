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

const getDashboard = async () => (await apiClient.get('/api/teacher/dashboard')).data;
const validateLog = async (logId: number) => (await apiClient.patch(`/api/teacher/validate/${logId}`)).data;
const getClassHistory = async (studentId?: string) => (await apiClient.get('/api/teacher/history', { params: { studentId } })).data;
const generateReport = async (payload: { studentId: number, startDate: string, endDate: string }) => 
    (await apiClient.post('/api/teacher/generate-report', payload)).data;

export default { getDashboard, validateLog, getClassHistory, generateReport };