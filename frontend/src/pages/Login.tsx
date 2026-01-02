import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth, API_HOST } from '../services/authService';
import { 
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
        style: { borderRadius: '20px', fontWeight: 'bold' }
      });

      // Redirect Logic
      setTimeout(() => {
        switch (user.role) {
          case 'student': navigate('/student/beranda', { replace: true }); break;
          case 'teacher': navigate('/teacher/dashboard', { replace: true }); break;
          case 'parent': navigate('/parent/dashboard', { replace: true }); break;
          case 'contributor': navigate('/contributor/dashboard', { replace: true }); break;
          case 'admin': navigate('/admin/dashboard', { replace: true }); break;
          default: navigate('/login');
        }
      }, 800);

    } catch (err: any) {
      toast.dismiss(toastId);
      const msg = err.response?.data?.message || 'Login gagal. Periksa kembali data Anda.';
      toast.error(msg, { style: { borderRadius: '20px', fontWeight: 'bold' } });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 selection:bg-violet-100 selection:text-violet-900 font-sans relative overflow-hidden">
      
      {/* Dekorasi Latar Belakang - Style Konsisten */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-violet-200/40 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-fuchsia-200/40 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>

      <div className="w-full max-w-lg bg-white/80 backdrop-blur-xl p-10 md:p-14 rounded-[3.5rem] shadow-2xl shadow-violet-100/50 border border-white/50 relative z-10">
        
        {/* HEADER */}
        <div className="text-center mb-12">
          <div className="inline-flex p-5 bg-gradient-to-br from-violet-50 to-fuchsia-50 rounded-[2.5rem] mb-8 shadow-inner ring-4 ring-white">
            <img src="/logo-smpn6.png" alt="Logo SMPN 6" className="w-20 h-20 object-contain drop-shadow-md" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-3 flex justify-center items-center gap-2">
            Masuk Akun 
          </h1>
          <p className="text-slate-500 font-medium text-lg leading-relaxed">Selamat datang kembali di portal <span className="text-violet-600 font-black">Kokurikuler SMPN 6 Pekalongan</span>.</p>
        </div>

        {/* GOOGLE LOGIN - Style Tombol Rounded Besar */}
        <div className="mb-10">
          <a
            href={`${API_HOST}/api/auth/google`}
            className="group w-full flex items-center justify-center gap-4 py-5 px-6 border-2 border-slate-100 rounded-[2rem] bg-white hover:bg-slate-50 hover:border-violet-100 hover:shadow-lg hover:shadow-violet-100 transition-all active:scale-[0.98]"
          >
            <img 
              src="https://www.svgrepo.com/show/475656/google-color.svg" 
              alt="Google" 
              className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" 
            />
            <span className="font-bold text-slate-700 text-base">Lanjutkan dengan Google</span>
          </a>
        </div>

        {/* DIVIDER */}
        <div className="relative flex items-center justify-center mb-10">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t-2 border-slate-100 rounded-full"></div>
          </div>
          <div className="relative bg-white px-6 py-1 rounded-full border border-slate-50">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Akses Manual</span>
          </div>
        </div>

        {/* LOGIN FORM */}
        <form onSubmit={handleLogin} className="space-y-6">
          
          {/* Input Identifier */}
          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">ID Pengguna (NoTelp / NISN / NIP)</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-slate-400 group-focus-within:text-violet-600 transition-colors">
                <User size={22} />
              </div>
              <input
                type="text"
                placeholder="Contoh: 0054xxxxx"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full pl-16 pr-6 py-5 bg-slate-50 border-2 border-transparent hover:border-violet-100 focus:border-violet-500 rounded-[2rem] font-bold text-slate-800 outline-none focus:bg-white transition-all placeholder:text-slate-300 shadow-inner focus:shadow-violet-100/50"
                required
              />
            </div>
          </div>

          {/* Input Password */}
          <div className="space-y-2">
            <div className="flex justify-between items-center px-4">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Kata Sandi</label>
              <a href="#" className="text-[11px] font-bold text-violet-600 hover:text-violet-800 transition-colors hover:underline decoration-2 underline-offset-4">Lupa Password?</a>
            </div>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-slate-400 group-focus-within:text-violet-600 transition-colors">
                <Lock size={22} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-16 pr-14 py-5 bg-slate-50 border-2 border-transparent hover:border-violet-100 focus:border-violet-500 rounded-[2rem] font-bold text-slate-800 outline-none focus:bg-white transition-all placeholder:text-slate-300 shadow-inner focus:shadow-violet-100/50"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-6 flex items-center text-slate-400 hover:text-violet-600 transition-colors"
              >
                {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-violet-600 text-white font-black text-lg rounded-[2rem] shadow-xl shadow-violet-200 hover:bg-violet-700 hover:shadow-2xl hover:shadow-violet-300 hover:-translate-y-1 active:scale-95 active:translate-y-0 transition-all flex items-center justify-center gap-3 mt-6 disabled:opacity-70 disabled:cursor-not-allowed group"
          >
            {loading ? (
              <>
                <Loader2 size={24} className="animate-spin" />
                <span className="tracking-widest text-sm">MEMPROSES...</span>
              </>
            ) : (
              <>
                <span>MASUK SEKARANG</span>
                <div className="bg-white/20 p-1.5 rounded-full group-hover:bg-white/30 transition-colors">
                    <ArrowRight size={20} />
                </div>
              </>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="mt-12 text-center">
          <p className="text-sm font-bold text-slate-500">
            Belum memiliki akun?{' '}
            <Link 
              to="/register" 
              className="text-violet-600 font-black hover:text-violet-800 transition-all inline-flex items-center gap-1 group relative"
            >
              Daftar Sekarang
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-violet-600 group-hover:w-full transition-all duration-300"></span>
            </Link>
          </p>
        </div>

        {/* Security Badge - Style Minimalis */}
        <div className="mt-16 flex justify-center opacity-40 hover:opacity-100 transition-opacity duration-500">
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                <ShieldCheck size={14} className="text-violet-400"/>
                <span>SMPN 6 PEKALONGAN &bull; SECURE</span>
            </div>
        </div>

      </div>
    </div>
  );
};

export default Login;