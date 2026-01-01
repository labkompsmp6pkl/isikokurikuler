import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

// ==========================================
// 1. Definisi Tipe Data
// ==========================================
export interface User {
  id: number;
  name: string;
  role: 'student' | 'teacher' | 'contributor' | 'parent';
  username?: string;
}

export interface RegistrationData {
  fullName: string;
  role: 'student' | 'teacher' | 'contributor' | 'parent';
  password?: string;
  nisn?: string;
  nip?: string;
  class?: string;
  whatsappNumber?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (loginIdentifier: string, password: string) => Promise<any>;
  register: (data: RegistrationData) => Promise<any>;
  logout: () => void;
  isLoading: boolean;
}

// ==========================================
// 2. Setup Axios
// ==========================================
export const API_HOST = import.meta.env.VITE_API_BASE_URL || '';

const authApi = axios.create({
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

  const login = async (loginIdentifier: string, password: string) => {
    try {
      const response = await authApi.post('/auth/login', { loginIdentifier, password });
      const { token: newToken, user: newUser } = response.data;

      setToken(newToken);
      setUser(newUser);

      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));
      
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const register = async (data: RegistrationData) => {
    try {
      const response = await authApi.post('/auth/register', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login'; 
  };

  // Kita bungkus value dalam object terpisah untuk menghindari error syntax 'comma operator'
  const contextValue: AuthContextType = {
    user,
    token,
    login,
    register,
    logout,
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
// 6. Default Export (Legacy/Direct Usage)
// ==========================================
export default {
  login: (loginIdentifier: string, password: string) => authApi.post('/auth/login', { loginIdentifier, password }),
  register: (data: RegistrationData) => authApi.post('/auth/register', data),
  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = '/login';
  },
  API_HOST
};