import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

// ==========================================
// 1. Definisi Tipe Data
// ==========================================
export interface User {
  id: number;
  name: string;
  full_name?: string; 
  role: 'student' | 'teacher' | 'parent' | 'contributor' | 'admin' | 'alumni' | string;
  classId?: string | number; 
  class_name?: string;
  personal_email?: string; 
  [key: string]: any; 
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
  updateUserContext: (userData: any) => void; 
  isLoading: boolean;
}

// ==========================================
// 2. Setup Axios & Interceptors
// ==========================================
export const API_HOST = import.meta.env.VITE_API_BASE_URL || '';

export const authApi = axios.create({
  baseURL: `${API_HOST}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Menambahkan Token ke Header
authApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response Interceptor: Menangani Token Expired (401)
authApi.interceptors.response.use(
  (response) => response,
  (error) => {
    // Jika server merespons 401 (Unauthorized), maka sesi dianggap habis
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      // Paksa halaman kembali ke login
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

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

  // Cek sesi saat aplikasi pertama kali dimuat
  useEffect(() => {
    const checkSession = () => {
      const storedUser = localStorage.getItem('user');
      const storedToken = localStorage.getItem('token');
      
      if (storedUser && storedToken) {
        try {
          setUser(JSON.parse(storedUser));
          setToken(storedToken);
        } catch (e) {
          console.error("Gagal memuat sesi:", e);
          logout(); // Bersihkan jika data korup
        }
      } else {
        // Jika salah satu tidak ada, pastikan status logout
        setUser(null);
        setToken(null);
      }
      setIsLoading(false);
    };

    checkSession();
  }, []);

  const handleAuthSuccess = (newToken: string, newUser: any) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  const updateUserContext = (updatedData: any) => {
    if (!user) return;
    const mergedUser = { ...user, ...updatedData };
    setUser(mergedUser);
    localStorage.setItem('user', JSON.stringify(mergedUser));
  };

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
    // Mencegah looping redirect jika sudah di halaman login
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  };

  const contextValue: AuthContextType = {
    user,
    token,
    login,
    register,
    completeGoogleRegistration,
    logout,
    updateUserContext,
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