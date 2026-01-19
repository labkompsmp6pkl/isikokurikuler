import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Instance Axios
export const teacherApi = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Interceptor Token
teacherApi.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers['Authorization'] = `Bearer ${token}`;
    return config;
});

// --- API ACTIONS ---

const getDashboard = async () => (await teacherApi.get('/api/teacher/dashboard')).data;

const validateLog = async (logId: number) => (await teacherApi.patch(`/api/teacher/validate/${logId}`)).data;

const validateBulkLogs = async (logIds: number[]) => {
    const promises = logIds.map(id => teacherApi.patch(`/api/teacher/validate/${id}`));
    const results = await Promise.all(promises);
    return results.map(r => r.data);
};

const getClassHistory = async (studentId?: string) => (await teacherApi.get('/api/teacher/history', { params: { studentId } })).data;

const getValidationLogs = async () => (await teacherApi.get('/api/teacher/validation-logs')).data;

const getStudentParents = async (studentId: number) => {
  const response = await teacherApi.get(`/api/teacher/students/${studentId}/parents`);
  return response.data;
};

// --- [BARU] FITUR RAPOR & AI ---

// Generate Rapor AI
const generateReport = async (payload: { 
    studentId: number, 
    classId: number, 
    academicYear: string, 
    semester: string, 
    comparisonMode: string 
}) => (await teacherApi.post('/api/teacher/generate-report', payload)).data;

// Simpan Rapor Manual
const saveReportData = async (payload: any) => (await teacherApi.post('/api/teacher/save-report', payload)).data;

// Ambil Data Rapor Tersimpan
const getStudentReportData = async (params: { studentId: number, academicYear: string, semester: string }) => 
    (await teacherApi.get('/api/teacher/get-report-data', { params })).data;

// Promosi / Kenaikan Kelas
const promoteStudents = async (payload: { studentIds: number[], targetClassId: number | null, isAlumni: boolean }) => 
    (await teacherApi.post('/api/teacher/promote-students', payload)).data;

const getAllClasses = async () => (await teacherApi.get('/api/auth/classes-list')).data;

export default { 
    getDashboard, 
    validateLog, 
    validateBulkLogs,
    getClassHistory, 
    getValidationLogs,
    getStudentParents,
    generateReport, 
    saveReportData,
    getStudentReportData,
    promoteStudents, 
    getAllClasses    
};