import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
// Import authApi dan useAuth dari file AuthService Anda
import { useAuth, authApi } from '../services/authService'; // Sesuaikan path import

interface ClassOption {
  id: string;
  name: string;
}

const GoogleRegisterComplete = () => {
  const navigate = useNavigate();
  // Kita ambil fungsi completeGoogleRegistration dari context
  const { completeGoogleRegistration } = useAuth(); 

  // --- STATE ---
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Data Form
  const [role, setRole] = useState('student');
  const [fullName, setFullName] = useState('');
  
  // Field Dinamis
  const [identityNumber, setIdentityNumber] = useState(''); 
  const [phoneNumber, setPhoneNumber] = useState('');     
  const [selectedClass, setSelectedClass] = useState(''); 
  
  // Data API
  const [classList, setClassList] = useState<ClassOption[]>([]);

  // 1. INISIALISASI TOKEN & KELAS
  useEffect(() => {
    const initialize = async () => {
      try {
        // A. AMBIL TOKEN DARI URL
        const params = new URLSearchParams(window.location.search);
        const urlToken = params.get('token');
        const localToken = localStorage.getItem('token');

        const finalToken = urlToken || localToken;

        if (!finalToken) {
           throw new Error('Sesi tidak ditemukan. Token kosong.');
        }

        // PENTING: Simpan ke localStorage SEGERA.
        // Karena authApi (interceptor) membaca dari localStorage untuk setiap request.
        localStorage.setItem('token', finalToken);
        
        // B. AMBIL DATA KELAS MENGGUNAKAN authApi
        // Tidak perlu hardcode URL lengkap, cukup endpointnya saja.
        // Token otomatis terkirim lewat header oleh interceptor di AuthService.
        try {
            console.log("Mengambil data kelas...");
            
            // Perhatikan path ini relatif terhadap API_HOST di AuthService
            const response = await authApi.get('/admin/classes/list'); // atau /classes/list sesuai route public backend Anda

            const data = response.data.data || response.data;
            setClassList(Array.isArray(data) ? data : []);

        } catch (classErr: any) {
            console.error("Gagal ambil kelas:", classErr);
            // Jangan stop proses jika kelas gagal, user mungkin bukan siswa
        }

      } catch (err: any) {
        console.error("Error Inisialisasi:", err);
        setError(err.message);
      } finally {
        setInitLoading(false);
      }
    };

    initialize();
  }, []); // Run once on mount

  // 2. LOGIKA TAMPILAN FIELD
  const showClassDropdown = ['student', 'teacher'].includes(role);
  const showIdentityInput = ['student', 'teacher', 'contributor'].includes(role);
  const showPhoneInput = ['parent'].includes(role);

  const getIdentityLabel = () => {
    if (role === 'student') return 'NISN';
    if (role === 'teacher') return 'NIP / NIS';
    return 'Nomor Induk / NIS';
  };

  // 3. HANDLE SUBMIT
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validasi sederhana
    if (!fullName.trim()) return setError('Nama Lengkap wajib diisi!');

    if (showIdentityInput && !identityNumber.trim()) {
      return setError(`${getIdentityLabel()} wajib diisi!`);
    }
    if (showClassDropdown && !selectedClass) {
      return setError('Silakan pilih kelas!');
    }
    if (showPhoneInput && !phoneNumber.trim()) {
      return setError('Nomor Telepon wajib diisi!');
    }

    setLoading(true);
    try {
      // Susun Payload
      const payload: any = { role, fullName };
      if (showIdentityInput) payload.nisn = identityNumber; 
      if (showClassDropdown) payload.classId = selectedClass;
      if (showPhoneInput) payload.phoneNumber = phoneNumber;

      // PANGGIL FUNGSI DARI AUTH SERVICE
      // Token otomatis ditangani
      await completeGoogleRegistration(payload);

      // Redirect Sukses
      navigate('/dashboard'); 
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Gagal menyimpan data.');
    } finally {
      setLoading(false);
    }
  };

  if (initLoading) {
    return <div className="p-10 text-center">Memuat sesi...</div>;
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow-md border border-gray-200">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Lengkapi Data Akun</h2>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-4 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* PILIH ROLE */}
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">Peran Saya</label>
          <select
            className="w-full border border-gray-300 rounded px-3 py-2 bg-white"
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              setIdentityNumber('');
              setSelectedClass('');
              setPhoneNumber('');
            }}
          >
            <option value="student">Siswa</option>
            <option value="teacher">Guru</option>
            <option value="parent">Orang Tua</option>
            <option value="contributor">Kontributor</option>
          </select>
        </div>

        {/* NAMA LENGKAP */}
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">Nama Lengkap</label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded px-3 py-2"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            placeholder="Nama Lengkap Asli"
          />
        </div>

        {/* FIELD DINAMIS */}
        {showIdentityInput && (
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">{getIdentityLabel()}</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded px-3 py-2"
              value={identityNumber}
              onChange={(e) => setIdentityNumber(e.target.value)}
              required
              placeholder={`Masukkan ${getIdentityLabel()}`}
            />
          </div>
        )}

        {showPhoneInput && (
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">No. HP / WA</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded px-3 py-2"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
              placeholder="08..."
            />
          </div>
        )}

        {showClassDropdown && (
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">Pilih Kelas</label>
            <select
              className="w-full border border-gray-300 rounded px-3 py-2 bg-white"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              required
            >
              <option value="">-- Pilih Kelas --</option>
              {classList.map((cls) => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
            
            {classList.length === 0 && (
                <div className="text-xs text-red-500 mt-2 bg-red-50 p-2 rounded">
                    Data kelas kosong. Pastikan backend sudah berjalan dan route kelas terbuka.
                </div>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
        >
          {loading ? 'Menyimpan...' : 'Selesaikan Pendaftaran'}
        </button>
      </form>
    </div>
  );
};

export default GoogleRegisterComplete;