import React, { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import authService from '../services/authService';

type Role = 'student' | 'teacher' | 'contributor' | 'parent';

const classOptions = [
  '7A', '7B', '7C', '7D', '7E', '7F',
  '8A', '8B', '8C', '8D', '8E', '8F',
  '9A', '9B', '9C', '9D', '9E', '9F',
].map(c => ({ value: c, label: c }));

const Register: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<Role>('student');
  const [formData, setFormData] = useState({
    fullName: '',
    nisn: '',
    nip: '',
    whatsappNumber: '',
    class: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();

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
      const registrationData = {
        role: selectedRole,
        fullName: formData.fullName,
        password: formData.password,
        nisn: selectedRole === 'student' ? formData.nisn : undefined,
        nip: (selectedRole === 'teacher' || selectedRole === 'contributor') ? formData.nip : undefined,
        whatsappNumber: selectedRole === 'parent' ? formData.whatsappNumber : undefined,
        class: (selectedRole === 'student' || selectedRole === 'teacher') ? (formData.class || undefined) : undefined,
      };
      
      await authService.register(registrationData);
      
      toast.dismiss(loadingToast);
      toast.success('Pendaftaran berhasil! Silakan masuk.');
      navigate('/login');

    } catch (err: any) {
      toast.dismiss(loadingToast);
      const errorMessage = err.response?.data?.message || 'Pendaftaran gagal. Silakan coba lagi.';
      toast.error(errorMessage);
      setError(errorMessage);
      setLoading(false);
    }
  };
  
  const handleGoogleRegister = () => {
    const origin = window.location.origin;
    const googleLoginUrl = `${import.meta.env.VITE_API_URL}/api/auth/google?origin=${encodeURIComponent(origin)}`;
    window.location.href = googleLoginUrl;
  };

  const InputField: React.FC<{ name: string; placeholder: string; type?: string; required?: boolean; }> = 
  ({ name, placeholder, type = 'text', required = true }) => (
    <input 
      type={type}
      name={name}
      placeholder={placeholder}
      required={required}
      onChange={handleFormChange}
      className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
    />
  );

  const SelectField: React.FC<{ name: string; value: string; options: {value: string, label: string}[]; placeholder: string; required?: boolean; }> = 
  ({ name, value, options, placeholder, required = true }) => (
    <div className="relative">
      <select 
        name={name}
        value={value}
        required={required}
        onChange={handleFormChange}
        className={`appearance-none block w-full px-3 py-3 border border-gray-300 bg-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm pr-10 ${!value ? 'text-gray-500' : 'text-gray-900'}`}>
        <option value="" disabled>{placeholder}</option>
        {/* FIX: Menghapus className dari <option> untuk stabilitas cross-browser */}
        {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
      </div>
    </div>
  );

  const renderRoleSpecificFields = () => {
    switch (selectedRole) {
      case 'student':
        return (
          <>
            <InputField name="fullName" placeholder="Nama Lengkap" />
            <InputField name="nisn" placeholder="NISN (Nomor Induk Siswa Nasional)" />
            <SelectField name="class" value={formData.class} options={classOptions} placeholder="Pilih Kelas" />
          </>
        );
      case 'teacher':
        return (
          <>
            <InputField name="fullName" placeholder="Nama Lengkap" />
            <InputField name="nip" placeholder="NIP (Nomor Induk Pegawai)" />
            <SelectField name="class" value={formData.class} options={classOptions} placeholder="Pilih Kelas Wali (Opsional)" required={false} />
          </>
        );
      case 'contributor':
          return (
            <>
              <InputField name="fullName" placeholder="Nama Lengkap" />
              <InputField name="nip" placeholder="NIP (Nomor Induk Pegawai)" />
            </>
          );
      case 'parent':
        return (
          <>
            <InputField name="fullName" placeholder="Nama Lengkap Orang Tua/Wali" />
            <InputField name="whatsappNumber" placeholder="Nomor WhatsApp (Contoh: 08123456789)" />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-xl p-8 md:p-10 space-y-8 bg-white shadow-xl rounded-2xl">

        <div className="text-center">
          <img className="mx-auto h-20 w-auto" src="/logo-smpn6.png" alt="Logo SMPN 6 Pekalongan" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Buat Akun Baru</h2>
          <p className="mt-2 text-sm text-gray-600">Daftar untuk mengakses fitur Isokurikuler.</p>
        </div>

        <div>
          <button
            onClick={handleGoogleRegister}
            type="button"
            className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out"
          >
            <img className="h-5 w-5 mr-3" src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google logo" />
            Daftar dengan Google
          </button>
        </div>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="flex-shrink mx-4 text-sm text-gray-500">Atau daftar manual</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>

        <form onSubmit={handleRegister} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Saya mendaftar sebagai:</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(['student', 'teacher', 'parent', 'contributor'] as Role[]).map(role => (
                <button 
                  key={role} 
                  type="button" 
                  onClick={() => setSelectedRole(role)} 
                  className={`w-full text-center px-4 py-2 text-sm font-semibold rounded-lg border transition-colors duration-200 ${selectedRole === role ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-100'}`}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {renderRoleSpecificFields()}

          <InputField name="password" placeholder="Password" type="password" />
          <InputField name="confirmPassword" placeholder="Konfirmasi Password" type="password" />

          {error && <p className="text-sm text-red-600 text-center pt-1">{error}</p>}

          <div>
            <button type="submit" disabled={loading} className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed transition duration-150 ease-in-out">
              {loading ? 'MEMPROSES PENDAFTARAN...' : 'DAFTAR SEKARANG'}
            </button>
          </div>

          <p className="text-center text-sm text-gray-600 pt-3">
            Sudah punya akun? <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500 hover:underline">Masuk di sini</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;
