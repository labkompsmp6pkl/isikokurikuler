import React, { useState, FormEvent, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import authService, { RegistrationData } from '../services/authService'; // Impor tipe RegistrationData

type Role = 'student' | 'teacher' | 'parent' | 'contributor';

const GoogleRegister: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState<Role>('student');
  const [formData, setFormData] = useState({
    fullName: '',
    nisn: '',
    nip: '',
    whatsappNumber: '',
    class: '',
    google_id: '',
    email: '',
  });
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Opsi kelas untuk dropdown
  const classOptions = ['7A', '7B', '7C', '7D', '8A', '8B', '8C', '8D', '9A', '9B', '9C', '9D'];

  useEffect(() => {
    const google_id = searchParams.get('google_id');
    const email = searchParams.get('email');
    const full_name = searchParams.get('full_name');
    if (google_id && email && full_name) {
      setFormData(prev => ({
        ...prev,
        google_id,
        email,
        fullName: full_name,
      }));
    } else {
      navigate('/register');
      toast.error('Informasi dari Google tidak lengkap. Silakan coba lagi.');
    }
  }, [searchParams, navigate]);

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const loadingToast = toast.loading('Menyelesaikan pendaftaran...');

    try {
      const registrationData: RegistrationData = {
        provider: 'google',
        google_id: formData.google_id,
        email: formData.email,
        role: selectedRole,
        fullName: formData.fullName,
        nisn: selectedRole === 'student' ? formData.nisn : undefined,
        nip: selectedRole === 'teacher' || selectedRole === 'contributor' ? formData.nip : undefined,
        whatsappNumber: selectedRole === 'parent' ? formData.whatsappNumber : undefined,
        class: (selectedRole === 'student' || selectedRole === 'teacher') ? formData.class : undefined,
      };

      await authService.register(registrationData);
      
      toast.dismiss(loadingToast);
      toast.success('Pendaftaran berhasil! Silakan masuk.');

      setTimeout(() => {
        navigate('/login');
      }, 1000);

    } catch (err: any) {
      toast.dismiss(loadingToast);
      const errorMessage = err.response?.data?.message || 'Pendaftaran gagal. Silakan coba lagi.';
      toast.error(errorMessage);
      setError(errorMessage);
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const roles: { key: Role; label: string }[] = [
    { key: 'student', label: 'Siswa' },
    { key: 'teacher', label: 'Guru' },
    { key: 'contributor', label: 'Kolaborator' },
    { key: 'parent', label: 'Orang tua' },
  ];

  return (
    <>
    <GlobalStyles />
    <div className="min-h-screen w-full bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center">
          <img 
            className="mx-auto h-20 w-auto" 
            src="/logo-smpn6.png"
            alt="Logo SMPN 6 Pekalongan"
          />
          <h2 className="mt-4 text-3xl font-extrabold text-gray-900">
            Selesaikan Pendaftaran Google Anda
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Pilih peran Anda dan lengkapi detail di bawah ini untuk menyelesaikan pendaftaran.
          </p>
        </div>

        <div className="bg-white shadow-xl rounded-2xl p-8">
          <div className="mb-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-2 sm:space-x-4 overflow-x-auto" aria-label="Tabs">
              {roles.map((role) => (
                <button
                  key={role.key}
                  onClick={() => setSelectedRole(role.key)}
                  className={`whitespace-nowrap py-3 px-2 sm:px-4 border-b-2 font-medium text-sm transition-colors
                    ${selectedRole === role.key
                      ? 'border-blue-600 text-blue-700'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  {role.label}
                </button>
              ))}
            </nav>
          </div>
          
          <form onSubmit={handleRegister} className="space-y-5">
            <input type="hidden" name="role" value={selectedRole} />
            <input type="hidden" name="google_id" value={formData.google_id} />
            <input type="hidden" name="email" value={formData.email} />
            
            <div>
                <label htmlFor="fullName" className="text-sm font-medium text-gray-700">Nama Lengkap</label>
                <input id="fullName" name="fullName" type="text" required value={formData.fullName} onChange={handleInputChange} className="mt-1 input-field" placeholder="Masukkan nama lengkap Anda"/>
            </div>

            {selectedRole === 'student' && (
              <>
                <div>
                  <label htmlFor="nisn" className="text-sm font-medium text-gray-700">NISN</label>
                  <input id="nisn" name="nisn" type="text" required value={formData.nisn} onChange={handleInputChange} className="mt-1 input-field" placeholder="Nomor Induk Siswa Nasional"/>
                </div>
                <div>
                  <label htmlFor="class" className="text-sm font-medium text-gray-700">Kelas</label>
                  <select id="class" name="class" required value={formData.class} onChange={handleInputChange} className="mt-1 input-field">
                    <option value="" disabled>Pilih kelas</option>
                    {classOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
              </>
            )}

            {(selectedRole === 'teacher' || selectedRole === 'contributor') && (
              <>
                <div>
                  <label htmlFor="nip" className="text-sm font-medium text-gray-700">NIP / ID</label>
                  <input id="nip" name="nip" type="text" required value={formData.nip} onChange={handleInputChange} className="mt-1 input-field" placeholder="Nomor Induk Pegawai atau ID Khusus"/>
                </div>
                {selectedRole === 'teacher' && (
                  <div>
                    <label htmlFor="class" className="text-sm font-medium text-gray-700">Wali Kelas (Opsional)</label>
                    <select id="class" name="class" value={formData.class} onChange={handleInputChange} className="mt-1 input-field">
                      <option value="">Tidak, saya bukan wali kelas</option>
                      {classOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                )}
              </>
            )}
            
            {selectedRole === 'parent' && (
              <div>
                <label htmlFor="whatsappNumber" className="text-sm font-medium text-gray-700">Nomor WhatsApp</label>
                <input id="whatsappNumber" name="whatsappNumber" type="tel" required value={formData.whatsappNumber} onChange={handleInputChange} className="mt-1 input-field" placeholder="Diawali dengan 62, contoh: 628123..."/>
              </div>
            )}

            {error && <p className="text-sm text-red-600 text-center">{error}</p>}

            <div className="pt-2">
              <button type="submit" disabled={loading} className="w-full btn-primary">
                {loading ? 'MENDAFTAR...' : 'SELESAIKAN PENDAFTARAN'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
    </>
  );
}

const GlobalStyles = () => (
  <style>{`
    .input-field {
      display: block;
      width: 100%;
      padding: 0.75rem 1rem;
      border: 1px solid #D1D5DB;
      border-radius: 0.5rem;
      box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
      placeholder-color: #9CA3AF;
    }
    .input-field:focus {
      outline: none;
      border-color: #3B82F6;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
    }
    .btn-primary {
      display: flex;
      justify-content: center;
      padding: 0.75rem 1rem;
      border: 1px solid transparent;
      border-radius: 0.5rem;
      box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
      font-size: 0.875rem;
      font-weight: 500;
      color: white;
      background-color: #1D4ED8;
    }
    .btn-primary:hover {
      background-color: #1E40AF;
    }
    .btn-primary:focus {
      outline: none;
      box-shadow: 0 0 0 2px rgba(30, 64, 175, 0.5);
    }
    .btn-primary:disabled {
      background-color: #60A5FA;
      cursor: not-allowed;
    }
  `}</style>
);

export default GoogleRegister;
