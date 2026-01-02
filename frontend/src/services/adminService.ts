import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const API_URL = `${API_BASE_URL}/api/admin`;
const API_URL2 = `${API_BASE_URL}/api/auth`;

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return { headers: { Authorization: `Bearer ${token}` } };
};

// Fungsi baru untuk dashboard
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

const getClasses = async () => {
    const response = await axios.get(`${API_URL2}/classes-list`, getAuthHeaders());
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

const setupClassDatabase = async () => {
    const response = await axios.post(`${API_URL}/classes/setup`, {}, getAuthHeaders());
    return response.data;
};

const adminService = {
    getDashboardStats,
    generateAIAnalysis,
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    getClasses,
    createClass,
    generateClasses,
    updateClass,
    deleteClass,
    getClassDetail,
    setupClassDatabase,
    getTeachersList
};

export default adminService;