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
        // 1. Ambil Token dari URL (Penting: Sesuai log anda, token ada di URL)
        const params = new URLSearchParams(location.search);
        const urlToken = params.get('token');
        
        console.log("Token ditemukan di URL:", urlToken ? "YA" : "TIDAK");

        if (urlToken) {
          localStorage.setItem('token', urlToken);
        } else {
          // Jika di URL tidak ada, cek localStorage
          const localToken = localStorage.getItem('token');
          if (!localToken) {
            console.error("Token benar-benar kosong");
            navigate('/login?error=missing_token');
            return;
          }
        }

        // 2. Ambil Data Kelas
        try {
            // Pastikan API_HOST di AuthService mengarah ke https://backendkokurikuler.smpn6pekalongan.org
            const response = await authApi.get('/admin/classes/list'); 
            const data = response.data.data || response.data;
            setClassList(Array.isArray(data) ? data : []);
        } catch (classErr) {
            console.error("Gagal load kelas:", classErr);
            // Jangan redirect ke login jika hanya gagal load kelas
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

      await completeGoogleRegistration(payload);
      
      // Berikan jeda sedikit agar localStorage terupdate oleh AuthService
      setTimeout(() => {
        // Redirect berdasarkan role
        if (role === 'student') navigate('/student/dashboard');
        else if (role === 'teacher') navigate('/teacher/dashboard');
        else navigate('/dashboard');
      }, 500);

    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menyimpan pendaftaran');
      setLoading(false);
    }
  };

  if (initLoading) return <div className="p-10 text-center">Menyiapkan pendaftaran...</div>;

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow-md border border-gray-200">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Selesaikan Pendaftaran</h2>
      {error && <div className="bg-red-50 text-red-700 p-3 rounded mb-4 text-sm border-l-4 border-red-500">{error}</div>}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Input Role */}
        <div>
          <label className="block text-sm font-bold mb-1">Daftar Sebagai</label>
          <select className="w-full border p-2 rounded" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="student">Siswa</option>
            <option value="teacher">Guru</option>
            <option value="parent">Orang Tua</option>
            <option value="contributor">Kontributor</option>
          </select>
        </div>

        {/* Nama Lengkap (WAJIB MANUAL) */}
        <div>
          <label className="block text-sm font-bold mb-1">Nama Lengkap</label>
          <input className="w-full border p-2 rounded" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </div>

        {/* Input NISN/NIP */}
        {['student', 'teacher', 'contributor'].includes(role) && (
          <div>
            <label className="block text-sm font-bold mb-1">{role === 'student' ? 'NISN' : 'NIP/NIS'}</label>
            <input className="w-full border p-2 rounded" type="text" value={identityNumber} onChange={(e) => setIdentityNumber(e.target.value)} required />
          </div>
        )}

        {/* Dropdown Kelas */}
        {['student', 'teacher'].includes(role) && (
          <div>
            <label className="block text-sm font-bold mb-1">Kelas</label>
            <select className="w-full border p-2 rounded" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} required>
              <option value="">-- Pilih Kelas --</option>
              {classList.map(cls => <option key={cls.id} value={cls.id}>{cls.name}</option>)}
            </select>
          </div>
        )}

        {/* No HP */}
        {role === 'parent' && (
          <div>
            <label className="block text-sm font-bold mb-1">No. WhatsApp</label>
            <input className="w-full border p-2 rounded" type="text" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required />
          </div>
        )}

        <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white p-2 rounded font-bold hover:bg-blue-700 disabled:bg-gray-400">
          {loading ? 'Memproses...' : 'Daftar Sekarang'}
        </button>
      </form>
    </div>
  );
};

export default GoogleRegisterComplete;