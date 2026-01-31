import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const API_URL = `${API_BASE_URL}/api/admin`;

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return { headers: { Authorization: `Bearer ${token}` } };
};

// ==========================================
// 1. DASHBOARD & STATS
// ==========================================
const getDashboardStats = async (period: 'all' | 'active' = 'active') => {
    try {
        const response = await axios.get(`${API_URL}/dashboard-stats`, {
            ...getAuthHeaders(),
            params: { period }
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching admin stats:", error);
        throw error;
    }
};

const generateAIAnalysis = async () => {
    try {
        const response = await axios.post(`${API_URL}/generate-analysis`, {}, getAuthHeaders());
        return response.data;
    } catch (error) {
        console.error("Error generating AI analysis:", error);
        throw error;
    }
};

// ==========================================
// 2. USER MANAGEMENT
// ==========================================
const getUsers = async (params: any) => {
    const response = await axios.get(`${API_URL}/users`, { 
        ...getAuthHeaders(),
        params 
    });
    return response.data;
};

const getUserById = async (id: string | number) => {
    const response = await axios.get(`${API_URL}/users/${id}`, getAuthHeaders());
    return response.data;
};

// Alias untuk getUserById agar konsisten
const getUserDetail = getUserById;

const createUser = async (data: any) => {
    const response = await axios.post(`${API_URL}/users`, data, getAuthHeaders());
    return response.data;
};

const updateUser = async (id: string | number, data: any) => {
    const response = await axios.put(`${API_URL}/users/${id}`, data, getAuthHeaders());
    return response.data;
};

const deleteUser = async (id: number) => {
    const response = await axios.delete(`${API_URL}/users/${id}`, getAuthHeaders());
    return response.data;
};

// ==========================================
// 3. CLASS MANAGEMENT
// ==========================================
const getClasses = async (params?: any) => {
    const response = await axios.get(`${API_URL}/classes`, { 
        ...getAuthHeaders(),
        params 
    });
    return response.data;
};

const getClassDetail = async (id: number) => {
    const response = await axios.get(`${API_URL}/classes/${id}`, getAuthHeaders());
    return response.data;
};

const createClass = async (data: any) => {
    const response = await axios.post(`${API_URL}/classes`, data, getAuthHeaders());
    return response.data;
};

const generateClasses = async (data: any) => {
    const response = await axios.post(`${API_URL}/classes/generate`, data, getAuthHeaders());
    return response.data;
};

const updateClass = async (id: number, data: any) => {
    const response = await axios.put(`${API_URL}/classes/${id}`, data, getAuthHeaders());
    return response.data;
};

const deleteClass = async (id: number) => {
    const response = await axios.delete(`${API_URL}/classes/${id}`, getAuthHeaders());
    return response.data;
};

const deleteClassesBatch = async (academicYear: string) => {
    const response = await axios.post(`${API_URL}/classes/delete-batch`, { academic_year: academicYear }, getAuthHeaders());
    return response.data;
};

const setupClassDatabase = async () => {
    const response = await axios.post(`${API_URL}/classes/setup`, {}, getAuthHeaders());
    return response.data;
};

const getTeachersList = async () => {
    const response = await axios.get(`${API_URL}/teachers-list`, getAuthHeaders());
    return response.data;
};

// --- CLASS MEMBERS ---
const addStudentsToClass = async (classId: number, studentIds: number[]) => {
    const response = await axios.post(`${API_URL}/classes/${classId}/add-students`, { studentIds }, getAuthHeaders());
    return response.data;
};

const removeStudentsFromClass = async (classId: number, studentIds: number[]) => {
    const response = await axios.post(`${API_URL}/classes/${classId}/remove-students`, { studentIds }, getAuthHeaders());
    return response.data;
};

// ==========================================
// 4. SCHEDULE MANAGEMENT (JADWAL OTOMATIS)
// ==========================================
const uploadSchedule = async (formData: FormData) => {
    // Menggunakan authApi dari authService agar konsisten, 
    // atau axios dengan getAuthHeaders juga bisa.
    // 'Content-Type': 'multipart/form-data' ditangani otomatis oleh browser saat body FormData
    const response = await axios.post(`${API_URL}/schedule/upload`, formData, getAuthHeaders());
    return response.data;
};

const getClassSchedule = async (classId: string | number) => {
    const response = await axios.get(`${API_URL}/schedule/class/${classId}`, getAuthHeaders());
    return response.data;
};

// ==========================================
// 5. FAMILY RELATIONS
// ==========================================
const searchParents = async (query: string) => {
    const response = await axios.get(`${API_URL}/parents/search`, {
        ...getAuthHeaders(),
        params: { q: query }
    });
    return response.data;
};

const linkParent = async (data: { studentId: number, parentId: number, relationship: string }) => {
    const response = await axios.post(`${API_URL}/family/link`, data, getAuthHeaders());
    return response.data;
};

const unlinkParent = async (data: { studentId: number, parentId: number }) => {
    const response = await axios.post(`${API_URL}/family/unlink`, data, getAuthHeaders());
    return response.data;
};

// ==========================================
// 6. PROMOTION & ACADEMIC YEAR
// ==========================================
const promoteClass = async (data: { fromClassId: number, toClassId?: number, isGraduation: boolean }) => {
    const response = await axios.post(`${API_URL}/classes/promote`, data, getAuthHeaders());
    return response.data;
};

const resetAllClasses = async () => {
    const response = await axios.post(`${API_URL}/classes/reset-all`, {}, getAuthHeaders());
    return response.data;
};

const promoteBatch = async (mappings: any[]) => {
    const response = await axios.post(`${API_URL}/classes/promote-batch`, { mappings }, getAuthHeaders());
    return response.data;
};

const moveStudents = async (data: { studentIds: number[], targetClassId: number | null, isAlumni: boolean }) => {
    const response = await axios.post(`${API_URL}/classes/move-students`, data, getAuthHeaders());
    return response.data;
};

// ==========================================
// 7. GLOBAL SETTINGS
// ==========================================
const getAppSettings = async () => {
    const response = await axios.get(`${API_URL}/settings/academic-year`, getAuthHeaders());
    return response.data; // { current_academic_year, current_semester }
};

const getActiveAcademicYear = async () => {
    const data = await getAppSettings();
    return data.current_academic_year;
};

const updateGlobalSettings = async (newYear: string, newSemester: string, updateExistingClasses: boolean) => {
    const response = await axios.post(`${API_URL}/classes/update-year`, { newYear, newSemester, updateExistingClasses }, getAuthHeaders());
    return response.data;
};

const updateGlobalAcademicYear = async (newYear: string, updateExistingClasses: boolean) => {
    const response = await axios.post(`${API_URL}/classes/update-year`, { newYear, updateExistingClasses }, getAuthHeaders());
    return response.data;
};

// ==========================================
// EXPORT SERVICE OBJECT
// ==========================================
const adminService = {
    // Dashboard
    getDashboardStats,
    generateAIAnalysis,
    
    // Users
    getUsers,
    getUserById,
    getUserDetail,
    createUser,
    updateUser,
    deleteUser,
    
    // Classes
    getClasses,
    getClassDetail,
    createClass,
    generateClasses,
    updateClass,
    deleteClass,
    deleteClassesBatch,
    setupClassDatabase,
    getTeachersList,
    
    // Class Members
    addStudentsToClass,
    removeStudentsFromClass,
    
    // [BARU] Schedule (Jadwal)
    uploadSchedule,
    getClassSchedule,

    // Family
    searchParents,
    linkParent,
    unlinkParent,
    
    // Promotion
    promoteClass,
    resetAllClasses,
    resetAllStudents: resetAllClasses, // Alias
    promoteBatch,
    moveStudents,
    
    // Settings
    getAppSettings,
    getActiveAcademicYear,
    updateGlobalSettings,
    updateGlobalAcademicYear,
};

export default adminService;