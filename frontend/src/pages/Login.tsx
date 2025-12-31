import React, { useState, FormEvent, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import authService from '../services/authService';

const Login: React.FC = () => {
  const [formData, setFormData] = useState({ loginIdentifier: '', password: '' });
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const navigate = useNavigate();

  useEffect(() => {
    // Cek apakah user sudah punya token, jika ya langsung lempar ke dashboard
    const token = localStorage.getItem('token');
    const userString = localStorage.getItem('user');
    
    if (token && userString) {
      try {
        const user = JSON.parse(userString);
        redirectUser(user.role);
      } catch (e) {
        localStorage.clear();
      }
    }
  }, [navigate]);

  // Fungsi khusus untuk menangani pengalihan berdasarkan peran
  const redirectUser = (role: string) => {
    switch (role) {
      case 'admin':
        navigate('/admin/dashboard');
        break;
      case 'student':
        navigate('/student/dashboard');
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
        // Fallback jika role tidak dikenali, lempar ke student atau halaman default
        toast.error(`Peran pengguna tidak dikenali: ${role}`);
        navigate('/student/dashboard'); 
        break;
    }
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Toast loading
    const loadingToast = toast.loading('Sedang memverifikasi...');

    try {
      const response = await authService.login(formData.loginIdentifier, formData.password);
      
      // 1. Simpan data ke localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      // 2. Beri umpan balik sukses
      toast.dismiss(loadingToast);
      toast.success('Login berhasil! Mengalihkan...', { duration: 2000 });

      // 3. Jeda sedikit agar toast terbaca, lalu redirect
      // Menggunakan setTimeout agar state localStorage benar-benar siap (opsional tapi aman)
      setTimeout(() => {
        redirectUser(response.data.user.role);
      }, 500);

    } catch (err: any) {
      toast.dismiss(loadingToast);
      const errorMessage = err.response?.data?.message || 'Login gagal. Periksa username/password Anda.';
      toast.error(errorMessage);
      setError(errorMessage);
      setLoading(false); // Kembalikan loading ke false agar bisa dicoba lagi
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
          <img 
            className="mx-auto h-24 w-auto" 
            src="/logo-smpn6.png"
            alt="Logo SMPN 6 Pekalongan"
          />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            ISOKURIKULER
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            SMPN 6 PEKALONGAN
          </p>
        </div>

        <div className="bg-white shadow-xl rounded-2xl p-8 space-y-6">
          <form className="space-y-6" onSubmit={handleLogin}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="loginIdentifier" className="sr-only">NISN/NIP/No.Telp</label>
                <input 
                  id="loginIdentifier" 
                  name="loginIdentifier" 
                  type="text" 
                  required 
                  value={formData.loginIdentifier} 
                  onChange={handleInputChange} 
                  disabled={loading}
                  className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm disabled:bg-gray-100" 
                  placeholder="NISN/NIP/No.Telp" 
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">Password</label>
                <input 
                  id="password" 
                  name="password" 
                  type="password" 
                  required 
                  value={formData.password} 
                  onChange={handleInputChange} 
                  disabled={loading}
                  className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm disabled:bg-gray-100" 
                  placeholder="Password" 
                />
              </div>
            </div>

            {error && <p className="text-xs text-red-600 text-center">{error}</p>}

            <div>
              <button 
                type="submit" 
                disabled={loading} 
                className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                  loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors`}
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    MEMPROSES...
                  </span>
                ) : (
                  'MASUK'
                )}
              </button>
            </div>
          </form>
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