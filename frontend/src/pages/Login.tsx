import React, { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import authService from '../services/authService';

const Login: React.FC = () => {
  const [formData, setFormData] = useState({ loginIdentifier: '', password: '' });
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const loadingToast = toast.loading('Sedang masuk...');

    try {
      const response = await authService.login(formData.loginIdentifier, formData.password);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      toast.dismiss(loadingToast);
      toast.success('Login berhasil!');

      const user = response.data.user;
      let targetPath = '/login'; // Fallback
      
      switch (user.role) {
        case 'admin': targetPath = '/admin/dashboard'; break;
        case 'student': targetPath = '/student/dashboard'; break;
        case 'teacher': targetPath = '/teacher/dashboard'; break;
        case 'parent': targetPath = '/parent/dashboard'; break;
        case 'contributor': targetPath = '/contributor/dashboard'; break;
      }

      // Menggunakan window.location.href untuk full page reload
      window.location.href = targetPath;

    } catch (err: any) {
      toast.dismiss(loadingToast);
      const errorMessage = err.response?.data?.message || 'Login gagal. Periksa kredensial Anda.';
      toast.error(errorMessage);
      setError(errorMessage);
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGoogleLogin = () => {
    // Dapatkan origin saat ini (misal: https://isikokurikuler.vercel.app)
    const origin = window.location.origin;
    // Bangun URL dengan menyertakan origin sebagai query parameter
    const googleLoginUrl = `${import.meta.env.VITE_API_URL}/api/auth/google?origin=${encodeURIComponent(origin)}`;
    window.location.href = googleLoginUrl;
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
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

        <form className="mt-8 space-y-6 bg-white shadow-xl rounded-2xl p-8" onSubmit={handleLogin}>
          <div>
            <button
              onClick={handleGoogleLogin}
              type="button"
              className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <img className="h-5 w-5 mr-3" src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google logo" />
              Masuk dengan Google
            </button>
          </div>

          <div className="relative flex py-5 items-center">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="flex-shrink mx-4 text-gray-500 text-sm">Atau masuk dengan</span>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>

          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="loginIdentifier" className="sr-only">NISN/NIP/No.Telp</label>
              <input id="loginIdentifier" name="loginIdentifier" type="text" required value={formData.loginIdentifier} onChange={handleInputChange} className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm" placeholder="NISN/NIP/No.Telp" />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input id="password" name="password" type="password" required value={formData.password} onChange={handleInputChange} className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm" placeholder="Password" />
            </div>
          </div>

          {error && <p className="text-xs text-red-600 text-center">{error}</p>}

          <div>
            <button type="submit" disabled={loading} className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400">
              {loading ? 'MEMPROSES...' : 'MASUK'}
            </button>
          </div>

          <div className="text-sm text-center">
            <p className="text-gray-600">
              Belum punya akun? <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500 hover:underline">Daftar di sini</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;
