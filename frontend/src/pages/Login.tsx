import React, { useState } from 'react';
import authService from '../services/authService';
import { useNavigate, Link } from 'react-router-dom';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await authService.login(email, password);
      const { role } = response.data.user;

      // Logika pengalihan berdasarkan peran pengguna
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
        case 'contributor':
          navigate('/contributor/dashboard');
          break;
        case 'parent':
          navigate('/parent/dashboard');
          break;
        default:
          setError('Peran pengguna tidak dikenali.');
      }
    } catch (err) {
      setError('Email atau password salah. Silakan coba lagi.');
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 font-sans">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg">
        
        <div className="flex justify-center mb-6">
          <img src="/logo-smpn6.png" alt="Logo SMPN 6 Pekalongan" className="h-24" />
        </div>

        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Selamat Datang!</h2>
        
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="email">
              Alamat Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="contoh@email.com"
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-200 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          <div>
            <button 
              type="submit"
              className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75"
            >
              Login
            </button>
          </div>
        </form>

        <p className="text-center text-gray-600 mt-4">
          Belum punya akun? <Link to="/register" className="text-blue-600 hover:underline">Daftar di sini</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
