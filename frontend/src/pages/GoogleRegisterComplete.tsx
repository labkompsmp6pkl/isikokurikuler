import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, authApi } from '../services/authService'; 

interface ClassOption {
  id: string;
  name: string;
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
  const [selectedClass, setSelectedClass] = useState(''); 
  const [classList, setClassList] = useState<ClassOption[]>([]);

  useEffect(() => {
    const initialize = async () => {
      try {
        // --- 1. GUARD CLAUSE (Mencegah Loop) ---
        // Cek apakah user sebenarnya sudah terdaftar
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const user = JSON.parse(storedUser);
          // Jika role sudah ada dan bukan 'new_user', langsung ke dashboard
          if (user.role && user.role !== 'new_user') {
            console.log("User sudah memiliki role, mengalihkan...");
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
          // Opsional: Jika backend mengirim data user singkat di URL, simpan juga di sini
        } else {
          const localToken = localStorage.getItem('token');
          if (!localToken) {
            navigate('/login?error=missing_token');
            return;
          }
        }

        // --- 3. AMBIL DATA KELAS ---
        try {
            const response = await authApi.get('/auth/classes-list');
            const data = response.data.data || response.data;
            setClassList(Array.isArray(data) ? data : []);
        } catch (classErr) {
            console.error("Gagal load kelas:", classErr);
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
      const payload: any = { role, fullName };
      if (['student', 'teacher', 'contributor'].includes(role)) payload.nisn = identityNumber; 
      if (['student', 'teacher'].includes(role)) payload.classId = selectedClass;
      if (role === 'parent') payload.phoneNumber = phoneNumber;

      // 1. Kirim data ke backend (Backend harus mengembalikan token & user baru)
      const response = await completeGoogleRegistration(payload);
      
      // 2. Update LocalStorage secara manual untuk memastikan sinkronisasi instan
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));

      // 3. Arahkan ke dashboard spesifik dengan REPLACE agar tidak bisa back ke form
      setTimeout(() => {
        if (role === 'student') navigate('/student/beranda', { replace: true });
        else if (role === 'teacher') navigate('/teacher/dashboard', { replace: true });
        else if (role === 'parent') navigate('/parent/dashboard', { replace: true });
        else navigate('/dashboard', { replace: true });
      }, 100);

    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menyimpan pendaftaran');
      setLoading(false);
    }
  };

  if (initLoading) return (
    <div className="flex flex-col items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
      <p className="text-gray-600">Menyiapkan pendaftaran...</p>
    </div>
  );

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow-md border border-gray-200">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Selesaikan Pendaftaran</h2>
      
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded mb-4 text-sm border-l-4 border-red-500">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-bold mb-1 text-gray-700">Daftar Sebagai</label>
          <select 
            className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
            value={role} 
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="student">Siswa</option>
            <option value="teacher">Guru</option>
            <option value="parent">Orang Tua</option>
            <option value="contributor">Kontributor</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold mb-1 text-gray-700">Nama Lengkap</label>
          <input 
            className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
            type="text" 
            value={fullName} 
            onChange={(e) => setFullName(e.target.value)} 
            placeholder="Masukkan nama lengkap"
            required 
          />
        </div>

        {['student', 'teacher', 'contributor'].includes(role) && (
          <div>
            <label className="block text-sm font-bold mb-1 text-gray-700">
              {role === 'student' ? 'NISN' : 'NIP / Kode Identitas'}
            </label>
            <input 
              className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
              type="text" 
              value={identityNumber} 
              onChange={(e) => setIdentityNumber(e.target.value)} 
              placeholder={role === 'student' ? "10 digit NISN" : "Masukkan NIP/Identitas"}
              required 
            />
          </div>
        )}

        {['student', 'teacher'].includes(role) && (
          <div>
            <label className="block text-sm font-bold mb-1 text-gray-700">Kelas</label>
            <select 
              className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
              value={selectedClass} 
              onChange={(e) => setSelectedClass(e.target.value)} 
              required
            >
              <option value="">-- Pilih Kelas --</option>
              {classList.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
          </div>
        )}

        {role === 'parent' && (
          <div>
            <label className="block text-sm font-bold mb-1 text-gray-700">No. WhatsApp</label>
            <input 
              className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
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
          className="w-full bg-blue-600 text-white p-3 rounded font-bold hover:bg-blue-700 transition-colors disabled:bg-gray-400 mt-4"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Memproses...
            </span>
          ) : 'Selesaikan Pendaftaran'}
        </button>
      </form>
    </div>
  );
};

export default GoogleRegisterComplete;