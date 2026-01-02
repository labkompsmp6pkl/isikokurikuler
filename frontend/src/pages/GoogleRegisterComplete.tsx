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
  AlertCircle
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
        // A. Ambil Token dari URL (dikirim oleh Google Callback Backend)
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

        // B. Verifikasi Status User (Cek apakah sudah lengkap profilnya)
        try {
          // Panggil endpoint /me untuk ambil profil terbaru berdasarkan token
          const profileRes = await authApi.get('/auth/me'); 
          const userData = profileRes.data;

          // LOGIKA AUTO-LOGIN: Jika role sudah ada (bukan user baru/new_user), bypass ke dashboard
          if (userData.role && userData.role !== 'new_user') {
            localStorage.setItem('user', JSON.stringify(userData));
            
            const target = userData.role === 'student' ? '/student/beranda' : `/${userData.role}/dashboard`;
            toast.success(`Selamat datang kembali, ${userData.fullName}!`);
            navigate(target, { replace: true });
            return;
          }

          // Jika memang new_user, isi nama default dari data Google jika tersedia
          if (userData.fullName) setFullName(userData.fullName);

        } catch (profileErr) {
          console.error("Gagal verifikasi profil otomatis:", profileErr);
          // Jika error token (misal expired), arahkan ke login
          if ((profileErr as any).response?.status === 401) {
             navigate('/login?error=session_expired');
             return;
          }
        }

        // C. Ambil Daftar Kelas untuk Dropdown Relasional (class_id)
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
      // Menyiapkan Payload sesuai relasi class_id di database
      const payload: any = { 
        role, 
        fullName: fullName.trim() 
      };

      if (role === 'student') {
        payload.nisn = identityNumber;
        payload.classId = selectedClassId; // ID numerik
      } else if (role === 'teacher') {
        payload.nip = identityNumber;
        payload.classId = selectedClassId; // Wali kelas opsional
      } else if (role === 'contributor') {
        payload.nip = identityNumber;
      } else if (role === 'parent') {
        payload.phoneNumber = phoneNumber.replace(/\D/g, ''); // Hanya angka
      }

      const response = await completeGoogleRegistration(payload);
      
      // Update data sesi final
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));

      toast.success("Profil berhasil diperbarui!");
      
      // Redirect sesuai role yang baru dipilih
      const path = role === 'student' ? '/student/beranda' : `/${role}/dashboard`;
      navigate(path, { replace: true });

    } catch (err: any) {
      const msg = err.response?.data?.message || 'Gagal menyimpan profil. Periksa data Anda.';
      setError(msg);
      toast.error(msg);
      setLoading(false);
    }
  };

  // ==========================================
  // 3. RENDER LOGIC
  // ==========================================

  if (initLoading) return (
    <div className="flex flex-col items-center justify-center h-screen bg-white">
      <RefreshCw className="animate-spin text-indigo-600 mb-4" size={48} />
      <p className="text-slate-500 font-black text-[10px] tracking-[0.3em] uppercase">Memverifikasi Akun...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center py-12 px-4 selection:bg-indigo-100">
      <div className="max-w-md w-full p-10 bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 relative overflow-hidden">
        
        {/* Dekorasi Latar */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-50 rounded-full blur-3xl opacity-60"></div>

        <div className="text-center mb-10 relative z-10">
          <div className="p-4 bg-indigo-50 w-fit mx-auto rounded-3xl mb-6">
            <img src="/logo-smpn6.png" alt="Logo" className="w-16 h-16" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 leading-tight tracking-tight">Selesaikan Profil</h2>
          <p className="text-slate-500 font-medium mt-3 text-sm leading-relaxed px-2">
            Akun Google berhasil terhubung. Sedikit lagi untuk masuk ke sistem.
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl mb-8 text-xs font-bold border border-rose-100 flex items-center gap-3 animate-shake">
            <AlertCircle size={18} className="shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          {/* DAFTAR SEBAGAI */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Saya mendaftar sebagai</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400"><User size={18}/></div>
              <select 
                className="w-full border-2 border-slate-50 bg-slate-50 pl-11 pr-10 py-4 rounded-2xl font-bold text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition-all appearance-none cursor-pointer shadow-inner" 
                value={role} 
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="student">Siswa</option>
                <option value="teacher">Guru</option>
                <option value="parent">Orang Tua</option>
                <option value="contributor">Kontributor</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400"><ChevronDown size={18}/></div>
            </div>
          </div>

          {/* NAMA LENGKAP */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Lengkap</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400"><User size={18}/></div>
              <input 
                className="w-full border-2 border-slate-50 bg-slate-50 pl-11 pr-4 py-4 rounded-2xl font-bold text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-inner" 
                type="text" 
                value={fullName} 
                onChange={(e) => setFullName(e.target.value)} 
                placeholder="Nama Sesuai Ijazah"
                required 
              />
            </div>
          </div>

          {/* IDENTITAS (NISN/NIP) */}
          {['student', 'teacher', 'contributor'].includes(role) && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                {role === 'student' ? 'Nomor NISN' : 'NIP / Identitas Pegawai'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400"><ShieldCheck size={18}/></div>
                <input 
                  className="w-full border-2 border-slate-50 bg-slate-50 pl-11 pr-4 py-4 rounded-2xl font-bold text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-inner" 
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
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                {role === 'student' ? 'Pilih Kelas' : 'Wali Kelas (Opsional)'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400"><GraduationCap size={18}/></div>
                <select 
                  className="w-full border-2 border-slate-50 bg-slate-50 pl-11 pr-10 py-4 rounded-2xl font-bold text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition-all appearance-none cursor-pointer shadow-inner" 
                  value={selectedClassId} 
                  onChange={(e) => setSelectedClassId(e.target.value)} 
                  required={role === 'student'}
                >
                  <option value="">-- Pilih Kelas --</option>
                  {classList.map(cls => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400"><ChevronDown size={18}/></div>
              </div>
            </div>
          )}

          {/* WHATSAPP (KHUSUS ORANG TUA) */}
          {role === 'parent' && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nomor WhatsApp</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400"><Smartphone size={18}/></div>
                <input 
                  className="w-full border-2 border-slate-50 bg-slate-50 pl-11 pr-4 py-4 rounded-2xl font-bold text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-inner" 
                  type="text" 
                  value={phoneNumber} 
                  onChange={(e) => setPhoneNumber(e.target.value)} 
                  placeholder="08xxxxxxxx"
                  required 
                />
              </div>
            </div>
          )}

          <div className="pt-6">
            <button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-slate-900 text-white p-5 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-xs hover:bg-indigo-600 transition-all shadow-2xl shadow-slate-200 active:scale-95 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <RefreshCw className="animate-spin" size={16} /> Menyimpan...
                </span>
              ) : 'Simpan & Lanjutkan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GoogleRegisterComplete;