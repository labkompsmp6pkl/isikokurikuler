import React, { useState, FormEvent, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth, API_HOST, authApi } from '../services/authService'; 

// --- Komponen UI Pendukung ---

type InputFieldProps = {
  name: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  required?: boolean;
};

const InputField: React.FC<InputFieldProps> = ({ name, placeholder, value, onChange, type = 'text', required = true }) => (
  <input 
    type={type}
    name={name}
    placeholder={placeholder}
    required={required}
    value={value}
    onChange={onChange}
    className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-xl focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
  />
);

type SelectFieldProps = {
  name: string;
  value: string;
  options: {value: string | number, label: string}[];
  placeholder: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  required?: boolean;
};

const SelectField: React.FC<SelectFieldProps> = ({ name, value, options, placeholder, onChange, required = true }) => (
  <div className="relative">
    <select 
      name={name}
      value={value}
      required={required}
      onChange={onChange}
      className={`appearance-none block w-full px-3 py-3 border border-gray-300 bg-white rounded-xl focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm pr-10 ${!value ? 'text-gray-500' : 'text-gray-900'}`}>
      <option value="" disabled>{placeholder}</option>
      {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
    </select>
    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
    </div>
  </div>
);

// --- Tipe Data ---

type Role = 'student' | 'teacher' | 'contributor' | 'parent';

interface ClassData {
  id: string | number;
  name: string;
}

const Register: React.FC = () => {
  const { register } = useAuth(); 
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState<Role>('student');
  const [classList, setClassList] = useState<ClassData[]>([]);
  const [formData, setFormData] = useState({
    fullName: '',
    nisn: '',
    nip: '',
    whatsappNumber: '',
    classId: '', 
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await authApi.get('/auth/classes-list');
        const data = response.data.data || response.data;
        if (Array.isArray(data)) setClassList(data);
      } catch (err) {
        console.error("Gagal mengambil daftar kelas:", err);
      }
    };
    fetchClasses();
  }, []);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Password dan konfirmasi password tidak cocok.');
      setLoading(false);
      toast.error('Password tidak cocok!');
      return;
    }

    const loadingToast = toast.loading('Mendaftarkan akun...');

    try {
      // Generate email otomatis berdasarkan nama
      const generatedEmail = `${formData.fullName.toLowerCase().replace(/\s+/g, '')}${Math.floor(1000 + Math.random() * 9000)}@isokurikuler.com`;

      const registrationData = {
        role: selectedRole,
        fullName: formData.fullName,
        email: generatedEmail,
        password: formData.password,
        nisn: selectedRole === 'student' ? formData.nisn : undefined,
        nip: (selectedRole === 'teacher' || selectedRole === 'contributor') ? formData.nip : undefined,
        whatsappNumber: selectedRole === 'parent' ? formData.whatsappNumber : undefined,
        classId: (selectedRole === 'student' || selectedRole === 'teacher') ? formData.classId : undefined,
      };
      
      const response = await register(registrationData);
      
      toast.dismiss(loadingToast);
      toast.success('Pendaftaran berhasil!');
      
      if (response.user) {
        const target = response.user.role === 'student' ? '/student/beranda' : `/${response.user.role}/dashboard`;
        navigate(target);
      } else {
        navigate('/login');
      }

    } catch (err: any) {
      toast.dismiss(loadingToast);
      const errorMessage = err.response?.data?.message || 'Pendaftaran gagal.';
      toast.error(errorMessage);
      setError(errorMessage);
      setLoading(false);
    }
  };

  const renderRoleSpecificFields = () => {
    const mappedClassOptions = classList.map(c => ({ value: c.id, label: c.name }));

    return (
      <>
        <InputField name="fullName" placeholder="Nama Lengkap" value={formData.fullName} onChange={handleFormChange} />

        {selectedRole === 'student' && (
          <>
            <InputField name="nisn" placeholder="NISN (10 Digit)" value={formData.nisn} onChange={handleFormChange} />
            <SelectField 
              name="classId" 
              value={formData.classId} 
              options={mappedClassOptions} 
              placeholder="Pilih Kelas" 
              onChange={handleFormChange} 
            />
          </>
        )}

        {selectedRole === 'teacher' && (
          <>
            <InputField name="nip" placeholder="NIP / Identitas Guru" value={formData.nip} onChange={handleFormChange} />
            <SelectField 
              name="classId" 
              value={formData.classId} 
              options={mappedClassOptions} 
              placeholder="Pilih Kelas Wali (Opsional)" 
              required={false} 
              onChange={handleFormChange} 
            />
          </>
        )}

        {selectedRole === 'contributor' && (
          <InputField name="nip" placeholder="NIP / Kode Pegawai" value={formData.nip} onChange={handleFormChange} />
        )}

        {selectedRole === 'parent' && (
          <InputField name="whatsappNumber" placeholder="Nomor WhatsApp" value={formData.whatsappNumber} onChange={handleFormChange} />
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-xl p-8 md:p-10 space-y-8 bg-white shadow-xl rounded-2xl">
        <div className="text-center">
          <img className="mx-auto h-20 w-auto" src="/logo-smpn6.png" alt="Logo SMPN 6 Pekalongan" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 tracking-tight">Buat Akun Baru</h2>
          <p className="mt-2 text-sm text-gray-600">Daftar untuk mengakses fitur Isokurikuler.</p>
        </div>

        {/* --- GOOGLE REGISTER SECTION --- */}
        <div className="mt-4">
          <a 
            href={`${API_HOST}/api/auth/google`} 
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 shadow-sm text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <img 
              className="h-5 w-5" 
              src="https://www.svgrepo.com/show/475656/google-color.svg" 
              alt="Google Logo" 
            />
            <span>Daftar dengan Google</span>
          </a>

          <div className="relative mt-8 mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500 uppercase tracking-widest text-[10px] font-bold">Atau daftar manual</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleRegister} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Saya mendaftar sebagai:</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(['student', 'teacher', 'parent', 'contributor'] as Role[]).map(role => (
                <button 
                  key={role} 
                  type="button" 
                  onClick={() => {
                    setSelectedRole(role);
                    setFormData(prev => ({ ...prev, classId: '', nisn: '', nip: '', whatsappNumber: '' }));
                  }} 
                  className={`w-full text-center px-2 py-2 text-xs font-bold rounded-xl border transition-all ${selectedRole === role ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {renderRoleSpecificFields()}

          <InputField name="password" placeholder="Buat Password" type="password" value={formData.password} onChange={handleFormChange} />
          <InputField name="confirmPassword" placeholder="Konfirmasi Password" type="password" value={formData.confirmPassword} onChange={handleFormChange} />

          {error && <p className="text-xs text-red-600 text-center bg-red-50 p-2 rounded-lg">{error}</p>}

          <div>
            <button 
              type="submit" 
              disabled={loading} 
              className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 transition-all shadow-lg shadow-blue-100"
            >
              {loading ? 'MEMPROSES...' : 'DAFTAR SEKARANG'}
            </button>
          </div>

          {/* TOMBOL KEMBALI KE LOGIN */}
          <p className="text-center text-sm text-gray-600 pt-2">
            Sudah punya akun?{' '}
            <Link to="/login" className="font-bold text-blue-600 hover:text-blue-500 hover:underline">
              Masuk di sini
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;