import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth, API_HOST } from '../services/authService';
import { 
  LogIn, 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2, 
  ArrowRight,
  ShieldCheck 
} from 'lucide-react';

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  // State
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      toast.error("Mohon lengkapi data login.");
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Memverifikasi akun...');

    try {
      const { user } = await login(identifier, password);
      
      toast.dismiss(toastId);
      toast.success(`Selamat datang, ${user.fullName.split(' ')[0]}!`, {
        icon: '👋',
        style: { borderRadius: '15px', fontWeight: 'bold' }
      });

      // Redirect Logic berdasarkan Role
      setTimeout(() => {
        switch (user.role) {
          case 'student':
            navigate('/student/beranda', { replace: true });
            break;
          case 'teacher':
            navigate('/teacher/dashboard', { replace: true });
            break;
          case 'parent':
            navigate('/parent/dashboard', { replace: true });
            break;
          case 'contributor':
            navigate('/contributor/dashboard', { replace: true });
            break;
          case 'admin':
            navigate('/admin/dashboard', { replace: true });
            break;
          default:
            navigate('/login');
        }
      }, 500);

    } catch (err: any) {
      toast.dismiss(toastId);
      const msg = err.response?.data?.message || 'Login gagal. Periksa kembali data Anda.';
      toast.error(msg, { style: { borderRadius: '15px' } });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 selection:bg-indigo-100 selection:text-indigo-900 font-sans">
      
      {/* Dekorasi Latar Belakang (Opsional, agar mirip register) */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-50 rounded-full blur-3xl opacity-60 pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-50 rounded-full blur-3xl opacity-60 pointer-events-none"></div>

      <div className="w-full max-w-md bg-white p-8 md:p-12 rounded-[3rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-slate-100 relative z-10">
        
        {/* HEADER */}
        <div className="text-center mb-10">
          <div className="inline-flex p-4 bg-indigo-50 rounded-[2rem] mb-6 shadow-sm">
            <img src="/logo-smpn6.png" alt="Logo SMPN 6" className="w-16 h-16 object-contain" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Selamat Datang</h1>
          <p className="text-slate-500 font-medium">Masuk untuk melanjutkan aktivitas Isikokurikuler Anda.</p>
        </div>

        {/* GOOGLE LOGIN */}
        <div className="mb-8">
          <a
            href={`${API_HOST}/api/auth/google`}
            className="group w-full flex items-center justify-center gap-4 py-4 px-6 border-2 border-slate-100 rounded-2xl bg-white hover:bg-slate-50 hover:border-slate-200 transition-all active:scale-[0.98] shadow-sm"
          >
            <img 
              src="https://www.svgrepo.com/show/475656/google-color.svg" 
              alt="Google" 
              className="w-6 h-6 group-hover:scale-110 transition-transform" 
            />
            <span className="font-bold text-slate-700 text-sm">Masuk dengan Google</span>
          </a>
        </div>

        {/* DIVIDER */}
        <div className="relative flex items-center justify-center mb-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-100"></div>
          </div>
          <div className="relative bg-white px-4">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Atau Login Manual</span>
          </div>
        </div>

        {/* LOGIN FORM */}
        <form onSubmit={handleLogin} className="space-y-5">
          
          {/* Input Identifier */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider ml-1">Email / NISN / NIP</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                <User size={20} />
              </div>
              <input
                type="text"
                placeholder="Masukkan ID Pengguna"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold text-slate-800 outline-none focus:bg-white focus:border-indigo-500 transition-all placeholder:text-slate-400 placeholder:font-medium"
                required
              />
            </div>
          </div>

          {/* Input Password */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center ml-1 mr-1">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Password</label>
              <a href="#" className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors">Lupa Password?</a>
            </div>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                <Lock size={20} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Masukkan Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-12 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold text-slate-800 outline-none focus:bg-white focus:border-indigo-500 transition-all placeholder:text-slate-400 placeholder:font-medium"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-200 hover:bg-indigo-700 hover:shadow-2xl hover:-translate-y-1 active:scale-95 active:translate-y-0 transition-all flex items-center justify-center gap-3 mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span>MEMPROSES...</span>
              </>
            ) : (
              <>
                <LogIn size={20} />
                <span>MASUK SEKARANG</span>
              </>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="mt-10 text-center">
          <p className="text-sm font-medium text-slate-500">
            Belum memiliki akun?{' '}
            <Link 
              to="/register" 
              className="text-indigo-600 font-black hover:text-indigo-800 hover:underline transition-all inline-flex items-center gap-1 group"
            >
              Daftar di sini <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform"/>
            </Link>
          </p>
        </div>

        {/* Security Badge */}
        <div className="mt-12 flex justify-center opacity-30">
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                <ShieldCheck size={12} />
                <span>SMPN 6 PEKALONGAN</span>
            </div>
        </div>

      </div>
    </div>
  );
};

export default Login;