import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, authApi } from '../services/authService'; 
import toast from 'react-hot-toast';

interface ClassOption {
  id: string | number; // class_id dari database
  name: string;        // Nama kelas (misal: 7A)
}

const GoogleRegisterComplete = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { completeGoogleRegistration } = useAuth(); 

  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [role, setRole] = useState('student');
  const [fullName, setFullName] = useState('');
  const [identityNumber, setIdentityNumber] = useState(''); 
  const [phoneNumber, setPhoneNumber] = useState('');      
  const [selectedClassId, setSelectedClassId] = useState(''); // Menyimpan ID Kelas
  const [classList, setClassList] = useState<ClassOption[]>([]);

  useEffect(() => {
    const initialize = async () => {
      try {
        // --- 1. GUARD CLAUSE (Mencegah Loop) ---
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const user = JSON.parse(storedUser);
          if (user.role && user.role !== 'new_user') {
            const target = user.role === 'student' ? '/student/beranda' : `/${user.role}/dashboard`;
            navigate(target, { replace: true });
            return;
          }
        }

        // --- 2. PENANGANAN TOKEN DARI URL ---
        const params = new URLSearchParams(location.search);
        const urlToken = params.get('token');
        
        if (urlToken) {
          localStorage.setItem('token', urlToken);
        } else {
          const localToken = localStorage.getItem('token');
          if (!localToken) {
            navigate('/login?error=missing_token');
            return;
          }
        }

        // --- 3. AMBIL DATA KELAS (class_id & name) ---
        try {
            const response = await authApi.get('/auth/classes-list');
            const data = response.data.data || response.data;
            setClassList(Array.isArray(data) ? data : []);
        } catch (classErr) {
            console.error("Gagal load kelas:", classErr);
            toast.error("Gagal memuat daftar kelas.");
        }

      } catch (err: any) {
        setError("Gagal memproses sesi: " + err.message);
      } finally {
        setInitLoading(false);
      }
    };

    initialize();
  }, [location, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Menyiapkan Payload sesuai kebutuhan database relasional
      const payload: any = { 
        role, 
        fullName: fullName.trim() 
      };

      if (role === 'student') {
        payload.nisn = identityNumber;
        payload.classId = selectedClassId; // Mengirimkan class_id (integer)
      } else if (role === 'teacher') {
        payload.nip = identityNumber;
        payload.classId = selectedClassId; // Wali kelas opsional diisi class_id
      } else if (role === 'contributor') {
        payload.nip = identityNumber;
      } else if (role === 'parent') {
        payload.phoneNumber = phoneNumber.replace(/\D/g, ''); // Hanya angka
      }

      // 1. Kirim ke Backend
      const response = await completeGoogleRegistration(payload);
      
      // 2. Sinkronisasi LocalStorage
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));

      toast.success("Pendaftaran Berhasil!");

      // 3. Redirection
      setTimeout(() => {
        if (role === 'student') navigate('/student/beranda', { replace: true });
        else if (role === 'teacher') navigate('/teacher/dashboard', { replace: true });
        else if (role === 'parent') navigate('/parent/dashboard', { replace: true });
        else navigate('/dashboard', { replace: true });
      }, 100);

    } catch (err: any) {
      const msg = err.response?.data?.message || 'Gagal menyimpan pendaftaran';
      setError(msg);
      toast.error(msg);
      setLoading(false);
    }
  };

  if (initLoading) return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
      <p className="text-gray-600 font-medium">Menyiapkan pendaftaran...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-md mx-auto p-8 bg-white rounded-2xl shadow-xl border border-gray-100">
        <div className="text-center mb-8">
          <img src="/logo-smpn6.png" alt="Logo" className="w-16 h-16 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800">Lengkapi Profil</h2>
          <p className="text-gray-500 text-sm">Satu langkah lagi untuk memulai</p>
        </div>
        
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-xl mb-6 text-sm border border-red-100 flex items-center gap-2">
            <span className="font-bold">⚠️</span> {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Peran */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-gray-500 ml-1">Daftar Sebagai</label>
            <select 
              className="w-full border-2 border-gray-100 p-3 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition-all bg-gray-50 font-medium" 
              value={role} 
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="student">Siswa</option>
              <option value="teacher">Guru</option>
              <option value="parent">Orang Tua</option>
              <option value="contributor">Kontributor</option>
            </select>
          </div>

          {/* Nama */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-gray-500 ml-1">Nama Lengkap</label>
            <input 
              className="w-full border-2 border-gray-100 p-3 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition-all bg-gray-50 font-medium" 
              type="text" 
              value={fullName} 
              onChange={(e) => setFullName(e.target.value)} 
              placeholder="Sesuai ijazah/identitas"
              required 
            />
          </div>

          {/* Identitas (NISN/NIP) */}
          {['student', 'teacher', 'contributor'].includes(role) && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-gray-500 ml-1">
                {role === 'student' ? 'NISN (10 Digit)' : 'NIP / Kode Identitas'}
              </label>
              <input 
                className="w-full border-2 border-gray-100 p-3 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition-all bg-gray-50 font-medium" 
                type="text" 
                value={identityNumber} 
                onChange={(e) => setIdentityNumber(e.target.value)} 
                placeholder={role === 'student' ? "Contoh: 0081234567" : "Masukkan NIP anda"}
                required 
              />
            </div>
          )}

          {/* Dropdown Kelas menggunakan class_id */}
          {['student', 'teacher'].includes(role) && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-gray-500 ml-1">
                {role === 'student' ? 'Pilih Kelas' : 'Wali Kelas (Opsional)'}
              </label>
              <select 
                className="w-full border-2 border-gray-100 p-3 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition-all bg-gray-50 font-medium" 
                value={selectedClassId} 
                onChange={(e) => setSelectedClassId(e.target.value)} 
                required={role === 'student'}
              >
                <option value="">-- Pilih Kelas --</option>
                {classList.map(cls => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* WhatsApp untuk Orang Tua */}
          {role === 'parent' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-gray-500 ml-1">No. WhatsApp</label>
              <input 
                className="w-full border-2 border-gray-100 p-3 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition-all bg-gray-50 font-medium" 
                type="text" 
                value={phoneNumber} 
                onChange={(e) => setPhoneNumber(e.target.value)} 
                placeholder="Contoh: 08123456789"
                required 
              />
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-blue-600 text-white p-4 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all disabled:bg-gray-300 mt-6 active:scale-95"
          >
            {loading ? 'Sedang Memproses...' : 'Simpan & Masuk Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default GoogleRegisterComplete;