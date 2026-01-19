import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

// ==========================================
// 1. Definisi Tipe Data (DIPERBARUI)
// ==========================================
export interface User {
  id: number;
  name: string;
  full_name?: string; // Tambahan: karena backend sering kirim full_name
  role: 'student' | 'teacher' | 'parent' | 'contributor' | 'admin' | 'alumni' | string;
  classId?: string | number; 
  class_name?: string; // Tambahan: untuk fix error 'class_name does not exist'
  personal_email?: string; // Tambahan: untuk email pribadi
  [key: string]: any; // Tambahan: agar fleksibel menerima properti lain (nisn, nip, dll)
}

export interface RegistrationData {
  fullName: string;
  email: string; 
  role: string;
  password?: string;
  nisn?: string;
  nip?: string;
  classId?: string | number; 
  whatsappNumber?: string;
}

export interface GoogleCompleteData {
  role: string;
  fullName: string;
  nisn?: string;
  classId?: string | number;
  phoneNumber?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (loginIdentifier: string, password: string) => Promise<any>;
  register: (data: RegistrationData) => Promise<any>; 
  completeGoogleRegistration: (data: GoogleCompleteData) => Promise<any>;
  logout: () => void;
  updateUserContext: (userData: any) => void; // <--- FUNGSI BARU (PENTING)
  isLoading: boolean;
}

// ==========================================
// 2. Setup Axios & Environment
// ==========================================
export const API_HOST = import.meta.env.VITE_API_BASE_URL || '';

export const authApi = axios.create({
  baseURL: `${API_HOST}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

authApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// ==========================================
// 3. Context Creation
// ==========================================
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ==========================================
// 4. Provider Component
// ==========================================
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    
    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      } catch (e) {
        console.error("Failed to parse user data", e);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    setIsLoading(false);
  }, []);

  // Helper untuk simpan state sesi (Login/Register)
  const handleAuthSuccess = (newToken: string, newUser: any) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  // [BARU] Fungsi untuk update data user secara manual (Update Profil/Email)
  const updateUserContext = (updatedData: any) => {
    if (!user) return;
    const mergedUser = { ...user, ...updatedData };
    setUser(mergedUser);
    localStorage.setItem('user', JSON.stringify(mergedUser));
  };

  // --- ACTIONS ---

  const login = async (loginIdentifier: string, password: string) => {
    try {
      const response = await authApi.post('/auth/login', { loginIdentifier, password });
      const { token: newToken, user: newUser } = response.data;
      handleAuthSuccess(newToken, newUser);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const register = async (data: RegistrationData) => {
    try {
      const response = await authApi.post('/auth/register', data);
      
      // Jika backend dikonfigurasi untuk auto-login setelah register
      if (response.data.token && response.data.user) {
        handleAuthSuccess(response.data.token, response.data.user);
      }
      
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const completeGoogleRegistration = async (data: GoogleCompleteData) => {
    try {
      const response = await authApi.post('/auth/google/complete-register', data);
      if (response.data.token) {
         handleAuthSuccess(response.data.token, response.data.user);
      }
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = '/login'; 
  };

  const contextValue: AuthContextType = {
    user,
    token,
    login,
    register,
    completeGoogleRegistration,
    logout,
    updateUserContext, // Export fungsi ini agar bisa dipakai di komponen lain
    isLoading
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// ==========================================
// 5. Custom Hook
// ==========================================
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// ==========================================
// 6. Default Export
// ==========================================
export default {
  login: (loginIdentifier: string, password: string) => authApi.post('/auth/login', { loginIdentifier, password }),
  register: (data: RegistrationData) => authApi.post('/auth/register', data),
  completeGoogleRegistration: (data: GoogleCompleteData) => authApi.post('/auth/google/complete-register', data),
  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = '/login';
  },
  API_HOST
};