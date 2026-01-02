import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, authApi } from '../services/authService'; 
import toast from 'react-hot-toast';
import { 
  RefreshCw, 
  User, 
  ShieldCheck, 
  GraduationCap, 
  Smartphone, 
  ChevronDown,
  AlertCircle,
  CheckCircle2,
  Trophy,
  Heart
} from 'lucide-react';

interface ClassOption {
  id: string | number;
  name: string;
}

const GoogleRegisterComplete = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { completeGoogleRegistration } = useAuth(); 

  // --- UI STATES ---
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  const [error, setError] = useState('');
  
  // --- FORM STATES ---
  const [role, setRole] = useState('student');
  const [fullName, setFullName] = useState('');
  const [identityNumber, setIdentityNumber] = useState(''); 
  const [phoneNumber, setPhoneNumber] = useState('');      
  const [selectedClassId, setSelectedClassId] = useState('');
  const [classList, setClassList] = useState<ClassOption[]>([]);

  // ==========================================
  // 1. INITIALIZATION & AUTO-LOGIN CHECK
  // ==========================================
  useEffect(() => {
    const initialize = async () => {
      try {
        const params = new URLSearchParams(location.search);
        const urlToken = params.get('token');
        
        if (urlToken) {
          localStorage.setItem('token', urlToken);
        }

        const currentToken = urlToken || localStorage.getItem('token');
        if (!currentToken) {
          navigate('/login?error=missing_token');
          return;
        }

        try {
          const profileRes = await authApi.get('/auth/me'); 
          const userData = profileRes.data;

          if (userData.role && userData.role !== 'new_user') {
            localStorage.setItem('user', JSON.stringify(userData));
            const target = userData.role === 'student' ? '/student/beranda' : `/${userData.role}/dashboard`;
            toast.success(`Selamat datang kembali, ${userData.fullName}!`);
            navigate(target, { replace: true });
            return;
          }

          if (userData.fullName) setFullName(userData.fullName);

        } catch (profileErr) {
          console.error("Gagal verifikasi profil otomatis:", profileErr);
          if ((profileErr as any).response?.status === 401) {
             navigate('/login?error=session_expired');
             return;
          }
        }

        const classResponse = await authApi.get('/auth/classes-list');
        const classData = classResponse.data.data || classResponse.data;
        setClassList(Array.isArray(classData) ? classData : []);

      } catch (err: any) {
        setError("Gagal memproses sesi keamanan. Silakan login ulang.");
      } finally {
        setInitLoading(false);
      }
    };

    initialize();
  }, [location, navigate]);

  // ==========================================
  // 2. SUBMIT HANDLER
  // ==========================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload: any = { 
        role, 
        fullName: fullName.trim() 
      };

      if (role === 'student') {
        payload.nisn = identityNumber;
        payload.classId = selectedClassId;
      } else if (role === 'teacher') {
        payload.nip = identityNumber;
        payload.classId = selectedClassId;
      } else if (role === 'contributor') {
        payload.nip = identityNumber;
      } else if (role === 'parent') {
        payload.phoneNumber = phoneNumber.replace(/\D/g, '');
      }

      const response = await completeGoogleRegistration(payload);
      
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));

      toast.success("Profil berhasil diperbarui!", {
        style: { borderRadius: '20px', fontWeight: 'bold' }
      });
      
      const path = role === 'student' ? '/student/beranda' : `/${role}/dashboard`;
      navigate(path, { replace: true });

    } catch (err: any) {
      const msg = err.response?.data?.message || 'Gagal menyimpan profil. Periksa data Anda.';
      setError(msg);
      toast.error(msg, { style: { borderRadius: '20px', fontWeight: 'bold' } });
      setLoading(false);
    }
  };

  // ==========================================
  // 3. RENDER LOGIC
  // ==========================================

  if (initLoading) return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#F8FAFC]">
      <RefreshCw className="animate-spin text-violet-600 mb-4" size={48} />
      <p className="text-slate-500 font-black text-[10px] tracking-[0.3em] uppercase">Memverifikasi Akun...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center py-12 px-6 selection:bg-violet-100 selection:text-violet-900 font-sans relative overflow-hidden">
      
      {/* Background Decor - Konsisten dengan Login/Register */}
      <div className="fixed top-[-10%] right-[-5%] w-[40%] h-[40%] bg-violet-100/50 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="fixed bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-fuchsia-100/50 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-lg w-full p-10 bg-white/80 backdrop-blur-xl rounded-[3rem] shadow-2xl shadow-slate-200/50 border border-white/60 relative z-10">
        
        {/* HEADER */}
        <div className="text-center mb-10">
          <div className="inline-flex p-4 bg-gradient-to-tr from-violet-50 to-white rounded-[2.5rem] mb-6 shadow-sm ring-4 ring-white">
            <img src="/logo-smpn6.png" alt="Logo" className="w-16 h-16 object-contain" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 leading-tight tracking-tight mb-2">Selesaikan Profil</h2>
          <p className="text-slate-500 font-bold text-sm leading-relaxed px-4">
            Akun Google berhasil terhubung. Lengkapi data berikut untuk masuk ke sistem <span className="text-violet-600">Isikokurikuler</span>.
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 text-rose-600 p-5 rounded-[2rem] mb-8 text-xs font-bold border border-rose-100 flex items-center gap-3 animate-shake shadow-sm">
            <AlertCircle size={20} className="shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* PILIH PERAN (Bahasa Indonesia di UI, Inggris di Value) */}
          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">Saya mendaftar sebagai</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-slate-400 group-focus-within:text-violet-600 transition-colors">
                {role === 'student' && <GraduationCap size={20}/>}
                {role === 'teacher' && <ShieldCheck size={20}/>}
                {role === 'parent' && <Heart size={20}/>}
                {role === 'contributor' && <Trophy size={20}/>}
              </div>
              <select 
                className="w-full pl-16 pr-12 py-5 border-2 border-transparent bg-slate-50 hover:border-violet-100 focus:border-violet-500 rounded-[2rem] focus:outline-none focus:bg-white text-slate-900 font-bold text-sm transition-all appearance-none cursor-pointer shadow-inner focus:shadow-violet-100/50" 
                value={role} 
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="student">Siswa</option>
                <option value="teacher">Guru</option>
                <option value="parent">Orang Tua</option>
                <option value="contributor">Kontributor</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-6 flex items-center pointer-events-none text-slate-400 group-focus-within:text-violet-600">
                <ChevronDown size={20}/>
              </div>
            </div>
          </div>

          {/* NAMA LENGKAP */}
          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">Nama Lengkap</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-slate-400 group-focus-within:text-violet-600 transition-colors">
                <User size={20}/>
              </div>
              <input 
                className="w-full pl-16 pr-6 py-5 border-2 border-transparent bg-slate-50 hover:border-violet-100 focus:border-violet-500 rounded-[2rem] focus:outline-none focus:bg-white text-slate-900 font-bold text-sm transition-all shadow-inner focus:shadow-violet-100/50 placeholder:text-slate-300" 
                type="text" 
                value={fullName} 
                onChange={(e) => setFullName(e.target.value)} 
                placeholder="Nama Sesuai Identitas Resmi"
                required 
              />
            </div>
          </div>

          {/* IDENTITAS (NISN/NIP) */}
          {['student', 'teacher', 'contributor'].includes(role) && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">
                {role === 'student' ? 'Nomor NISN' : 'NIP / Identitas Pegawai'}
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-slate-400 group-focus-within:text-violet-600 transition-colors">
                  <ShieldCheck size={20}/>
                </div>
                <input 
                  className="w-full pl-16 pr-6 py-5 border-2 border-transparent bg-slate-50 hover:border-violet-100 focus:border-violet-500 rounded-[2rem] focus:outline-none focus:bg-white text-slate-900 font-bold text-sm transition-all shadow-inner focus:shadow-violet-100/50 placeholder:text-slate-300" 
                  type="text" 
                  value={identityNumber} 
                  onChange={(e) => setIdentityNumber(e.target.value)} 
                  placeholder={role === 'student' ? "10 Digit NISN" : "Masukkan NIP"}
                  required 
                />
              </div>
            </div>
          )}

          {/* KELAS BERBASIS class_id */}
          {['student', 'teacher'].includes(role) && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">
                {role === 'student' ? 'Pilih Kelas' : 'Wali Kelas (Opsional)'}
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-slate-400 group-focus-within:text-violet-600 transition-colors">
                  <GraduationCap size={20}/>
                </div>
                <select 
                  className="w-full pl-16 pr-12 py-5 border-2 border-transparent bg-slate-50 hover:border-violet-100 focus:border-violet-500 rounded-[2rem] focus:outline-none focus:bg-white text-slate-900 font-bold text-sm transition-all appearance-none cursor-pointer shadow-inner focus:shadow-violet-100/50" 
                  value={selectedClassId} 
                  onChange={(e) => setSelectedClassId(e.target.value)} 
                  required={role === 'student'}
                >
                  <option value="">-- Pilih Kelas --</option>
                  {classList.map(cls => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-6 flex items-center pointer-events-none text-slate-400 group-focus-within:text-violet-600">
                  <ChevronDown size={20}/>
                </div>
              </div>
            </div>
          )}

          {/* WHATSAPP (KHUSUS ORANG TUA) */}
          {role === 'parent' && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">Nomor WhatsApp</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-slate-400 group-focus-within:text-violet-600 transition-colors">
                  <Smartphone size={20}/>
                </div>
                <input 
                  className="w-full pl-16 pr-6 py-5 border-2 border-transparent bg-slate-50 hover:border-violet-100 focus:border-violet-500 rounded-[2rem] focus:outline-none focus:bg-white text-slate-900 font-bold text-sm transition-all shadow-inner focus:shadow-violet-100/50 placeholder:text-slate-300" 
                  type="text" 
                  value={phoneNumber} 
                  onChange={(e) => setPhoneNumber(e.target.value)} 
                  placeholder="08xxxxxxxx"
                  required 
                />
              </div>
            </div>
          )}

          <div className="pt-4">
            <button 
              type="submit" 
              disabled={loading} 
              className="group w-full py-5 bg-violet-600 text-white font-black text-lg rounded-[2.5rem] shadow-xl shadow-violet-200 hover:bg-violet-700 hover:shadow-2xl hover:shadow-violet-300 hover:-translate-y-1 active:scale-[0.98] transition-all flex justify-center items-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <RefreshCw className="animate-spin" size={24} />
                  <span className="tracking-widest text-sm">MENYIMPAN...</span>
                </>
              ) : (
                <>
                  <span>SIMPAN & LANJUTKAN</span>
                  <div className="bg-white/20 p-1.5 rounded-full group-hover:bg-white/30 transition-colors">
                    <CheckCircle2 size={20} className="group-hover:translate-x-0.5 transition-transform"/>
                  </div>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GoogleRegisterComplete;