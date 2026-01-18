import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const API_URL = `${API_BASE_URL}/api/admin`;

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return { headers: { Authorization: `Bearer ${token}` } };
};

// --- 1. Dashboard & Analisis ---
const getDashboardStats = async () => {
    try {
        const response = await axios.get(`${API_URL}/dashboard-stats`, getAuthHeaders());
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

// --- 2. User Management ---
const getUserDetail = async (id: number) => {
    const response = await axios.get(`${API_URL}/users/${id}`, getAuthHeaders());
    return response.data;
};

const getUsers = async (params: any) => {
    const response = await axios.get(`${API_URL}/users`, { 
        ...getAuthHeaders(),
        params 
    });
    return response.data;
};

const getUserById = async (id: string) => {
    const response = await axios.get(`${API_URL}/users/${id}`, getAuthHeaders());
    return response.data;
};

const createUser = async (data: any) => {
    const response = await axios.post(`${API_URL}/users`, data, getAuthHeaders());
    return response.data;
};

const updateUser = async (id: string, data: any) => {
    const response = await axios.put(`${API_URL}/users/${id}`, data, getAuthHeaders());
    return response.data;
};

const deleteUser = async (id: number) => {
    const response = await axios.delete(`${API_URL}/users/${id}`, getAuthHeaders());
    return response.data;
};

const getClasses = async (params?: any) => {
    const response = await axios.get(`${API_URL}/classes`, { 
        ...getAuthHeaders(),
        params // Kirim params (academic_year) ke backend
    });
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

const getClassDetail = async (id: number) => {
    const response = await axios.get(`${API_URL}/classes/${id}`, getAuthHeaders());
    return response.data;
};

const getTeachersList = async () => {
    const response = await axios.get(`${API_URL}/teachers-list`, getAuthHeaders());
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

// --- 4. Class Members (Manajemen Siswa dalam Kelas) ---
const addStudentsToClass = async (classId: number, studentIds: number[]) => {
    const response = await axios.post(`${API_URL}/classes/${classId}/add-students`, { studentIds }, getAuthHeaders());
    return response.data;
};

const removeStudentsFromClass = async (classId: number, studentIds: number[]) => {
    const response = await axios.post(`${API_URL}/classes/${classId}/remove-students`, { studentIds }, getAuthHeaders());
    return response.data;
};

// --- 5. Family Relations (Orang Tua - Siswa) ---
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

// --- 6. Promotion & Academic Year (Kenaikan Kelas & Tahun Ajaran) ---

// Kenaikan Kelas per Kelas (Tombol di ClassManagement)
const promoteClass = async (data: { fromClassId: number, toClassId?: number, isGraduation: boolean }) => {
    const response = await axios.post(`${API_URL}/classes/promote`, data, getAuthHeaders());
    return response.data;
};

// Reset Global (Kosongkan Semua Kelas)
const resetAllClasses = async () => {
    const response = await axios.post(`${API_URL}/classes/reset-all`, {}, getAuthHeaders());
    return response.data;
};

// Kenaikan Massal (Mapping Banyak Kelas)
const promoteBatch = async (mappings: any[]) => {
    const response = await axios.post(`${API_URL}/classes/promote-batch`, { mappings }, getAuthHeaders());
    return response.data;
};

// Pindah Siswa Manual (Pilih Siswa -> Pindah/Lulus)
const moveStudents = async (data: { studentIds: number[], targetClassId: number | null, isAlumni: boolean }) => {
    const response = await axios.post(`${API_URL}/classes/move-students`, data, getAuthHeaders());
    return response.data;
};

// --- 7. Settings (Pengaturan Global) ---

// Ambil Tahun Ajaran & Semester Aktif
const getAppSettings = async () => {
    const response = await axios.get(`${API_URL}/settings/academic-year`, getAuthHeaders());
    return response.data; // { current_academic_year, current_semester }
};

// Alias untuk kompatibilitas kode lama (hanya ambil tahun)
const getActiveAcademicYear = async () => {
    const data = await getAppSettings();
    return data.current_academic_year;
};

// Update Tahun Ajaran & Semester
const updateGlobalSettings = async (newYear: string, newSemester: string, updateExistingClasses: boolean) => {
    const response = await axios.post(`${API_URL}/classes/update-year`, { newYear, newSemester, updateExistingClasses }, getAuthHeaders());
    return response.data;
};

// Alias untuk updateGlobalAcademicYear (Hanya tahun, semester default ganjil jika tidak dikirim, atau menyesuaikan backend)
const updateGlobalAcademicYear = async (newYear: string, updateExistingClasses: boolean) => {
    // Kita panggil updateGlobalSettings dengan asumsi semester tetap/default jika fungsi lama dipanggil
    // Atau kirim null semester agar backend handle
    const response = await axios.post(`${API_URL}/classes/update-year`, { newYear, updateExistingClasses }, getAuthHeaders());
    return response.data;
};

// Reset Semua Siswa (Alias resetAllClasses untuk konsistensi penamaan)
const resetAllStudents = async () => {
    return await resetAllClasses();
};

const adminService = {
    // Dashboard
    getDashboardStats,
    generateAIAnalysis,
    
    // User
    getUsers,
    getUserById,
    getUserDetail,
    createUser,
    updateUser,
    deleteUser,
    
    // Class CRUD
    getClasses,
    createClass,
    generateClasses,
    updateClass,
    deleteClass,
    getClassDetail,
    setupClassDatabase,
    getTeachersList,
    
    // Class Members
    addStudentsToClass,
    removeStudentsFromClass,
    
    // Family
    searchParents,
    linkParent,
    unlinkParent,
    
    // Promotion
    promoteClass,
    resetAllClasses,
    promoteBatch,
    moveStudents,
    deleteClassesBatch,
    
    // Settings & Academic Year
    getAppSettings,          // New: Ambil {tahun, semester}
    getActiveAcademicYear,   // Legacy support
    updateGlobalSettings,    // New: Update {tahun, semester}
    updateGlobalAcademicYear,// Legacy support
    resetAllStudents         // Alias
};

export default adminService;