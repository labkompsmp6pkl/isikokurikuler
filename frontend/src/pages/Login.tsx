import React, { useState, FormEvent, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth, API_HOST } from '../services/authService'; 

const Login: React.FC = () => {
  const [formData, setFormData] = useState({ loginIdentifier: '', password: '' });
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const navigate = useNavigate();
  const { login, user, token } = useAuth(); 

  // --- 1. REDIRECT OTOMATIS ---
  useEffect(() => {
    if (token && user) {
      redirectUser(user.role);
    }
  }, [user, token, navigate]);

  const redirectUser = (role: string) => {
    // LOGIKA KRUSIAL: Jika role adalah 'new_user', arahkan ke pendaftaran lengkap
    if (role === 'new_user') {
      navigate('/google-register-complete');
      return;
    }

    switch (role) {
      case 'admin':
        navigate('/admin/dashboard');
        break;
      case 'student':
        navigate('/student/beranda'); // Sesuaikan dengan route student anda
        break;
      case 'teacher':
        navigate('/teacher/dashboard');
        break;
      case 'parent':
        navigate('/parent/dashboard');
        break;
      case 'contributor':
        navigate('/contributor/dashboard');
        break;
      default:
        navigate('/dashboard'); 
        break;
    }
  };

  // --- 2. HANDLE LOGIN MANUAL ---
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    const loadingToast = toast.loading('Sedang memverifikasi...');

    try {
      await login(formData.loginIdentifier, formData.password);
      toast.dismiss(loadingToast);
      toast.success('Login berhasil!');
      // Redirect akan ditangani oleh useEffect otomatis
    } catch (err: any) {
      toast.dismiss(loadingToast);
      const errorMessage = err.response?.data?.message || 'Login gagal. Periksa data Anda.';
      toast.error(errorMessage);
      setError(errorMessage);
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <img className="mx-auto h-24 w-auto" src="/logo-smpn6.png" alt="Logo SMPN 6 Pekalongan" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">ISOKURIKULER</h2>
          <p className="mt-2 text-sm text-gray-600">SMPN 6 PEKALONGAN</p>
        </div>

        <div className="bg-white shadow-xl rounded-2xl p-8 space-y-6">
          <form className="space-y-6" onSubmit={handleLogin}>
            <div className="rounded-md shadow-sm -space-y-px">
              <input 
                name="loginIdentifier" 
                type="text" 
                required 
                value={formData.loginIdentifier} 
                onChange={handleInputChange} 
                disabled={isSubmitting}
                className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm" 
                placeholder="NISN / NIP / No. WhatsApp" 
              />
              <input 
                name="password" 
                type="password" 
                required 
                value={formData.password} 
                onChange={handleInputChange} 
                disabled={isSubmitting}
                className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm" 
                placeholder="Password" 
              />
            </div>

            {error && <p className="text-xs text-red-600 text-center bg-red-50 p-2 rounded">{error}</p>}

            <button 
              type="submit" 
              disabled={isSubmitting} 
              className="w-full py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              {isSubmitting ? 'MEMPROSES...' : 'MASUK'}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300"></div></div>
              <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">Atau masuk dengan</span></div>
            </div>

            <a 
              href={`${API_HOST}/api/auth/google`} 
              className="mt-4 w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <img className="h-5 w-5" src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google Logo" />
              <span>Google</span>
            </a>
          </div>
        </div>

        <div className="text-sm text-center">
          <p className="text-gray-600">
            Belum punya akun? <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500 hover:underline">Daftar di sini</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;