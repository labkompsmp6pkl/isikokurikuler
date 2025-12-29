import React, { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import authService from '../services/authService';

const Login: React.FC = () => {
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const loadingToast = toast.loading('Mencoba masuk...');

    try {
      const response = await authService.login(loginIdentifier, password);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      const user = response.data.user;

      toast.dismiss(loadingToast);
      toast.success(`Halo, selamat datang ${user.fullName}!`);

      // --- PERBAIKAN DI SINI ---
      // Menggunakan window.location.href untuk memaksa pemuatan ulang halaman.
      // Ini memastikan seluruh aplikasi me-reset state-nya dan membaca data user yang baru dari localStorage.
      let targetPath = '/login'; // Default fallback
      switch (user.role) {
        case 'admin': targetPath = '/admin/dashboard'; break;
        case 'student': targetPath = '/student/dashboard'; break;
        case 'teacher': targetPath = '/teacher/dashboard'; break;
        case 'parent': targetPath = '/parent/dashboard'; break;
        case 'contributor': targetPath = '/contributor/dashboard'; break;
      }
      
      // Delay singkat untuk memastikan pengguna melihat toast sebelum halaman dimuat ulang
      setTimeout(() => {
        window.location.href = targetPath;
      }, 500); // 0.5 detik

    } catch (err: any) {
      toast.dismiss(loadingToast);
      const errorMessage = err.response?.data?.message || 'Login gagal. Periksa kredensial Anda.';
      toast.error(errorMessage);
      setError(errorMessage);
      setLoading(false); // Pastikan loading berhenti pada error
    }
    // Jangan set loading ke false di sini pada kasus sukses, karena halaman akan dimuat ulang
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

        <div className="bg-white shadow-xl rounded-2xl p-8 space-y-6">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="loginIdentifier" className="text-sm font-medium text-gray-700">
                Email / NISN / NIP / No. WhatsApp
              </label>
              <input
                id="loginIdentifier"
                name="loginIdentifier"
                type="text"
                autoComplete="username"
                required
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent sm:text-sm"
                placeholder="Masukkan pengenal Anda"
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent sm:text-sm"
                placeholder="Masukkan password Anda"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            
            {error && <p className="text-sm text-red-600 text-center">{error}</p>}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed"
              >
                {loading ? 'MEMPROSES...' : 'MASUK'}
              </button>
            </div>
          </form>
          
          <div className="text-sm text-center text-gray-600">
            <p>
              Belum punya akun?{' '}
              <Link to="/register" className="font-medium text-blue-700 hover:text-blue-600 hover:underline">
                Daftar di sini
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
