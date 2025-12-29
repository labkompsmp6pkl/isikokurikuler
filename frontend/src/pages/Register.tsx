import React, { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import authService from '../services/authService';

const Register: React.FC = () => {
  const [role, setRole] = useState<'student' | 'teacher' | 'parent' | 'contributor'>('student');
  const [formData, setFormData] = useState({
    fullName: '',
    password: '',
    nisn: '',
    nip: '',
    whatsappNumber: '',
    class: ''
  });
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (selectedRole: 'student' | 'teacher' | 'parent' | 'contributor') => {
    setRole(selectedRole);
    setFormData({ fullName: formData.fullName, password: formData.password, nisn: '', nip: '', whatsappNumber: '', class: '' });
    setError('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const loadingToast = toast.loading('Membuat akun Anda...');

    const registrationData = {
      role,
      fullName: formData.fullName,
      password: formData.password,
      nisn: role === 'student' ? formData.nisn : undefined,
      nip: (role === 'teacher' || role === 'contributor') ? formData.nip : undefined,
      whatsappNumber: role === 'parent' ? formData.whatsappNumber : undefined,
      class: role === 'student' ? formData.class : undefined,
    };

    try {
      await authService.register(registrationData);
      toast.dismiss(loadingToast);
      toast.success('Pendaftaran berhasil! Silakan masuk.');
      navigate('/login');
    } catch (err: any) {
      toast.dismiss(loadingToast);
      const errorMessage = err.response?.data?.message || 'Pendaftaran gagal. Silakan coba lagi.';
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderRoleSpecificFields = () => (
    <div className="space-y-4">
      {role === 'student' && (
        <>
          <InputField name="nisn" placeholder="NISN" value={formData.nisn} onChange={handleInputChange} required />
          <InputField name="class" placeholder="Kelas (Contoh: 7A, 8B)" value={formData.class} onChange={handleInputChange} required />
        </>
      )}
      {(role === 'teacher' || role === 'contributor') && (
        <InputField name="nip" placeholder="NIP" value={formData.nip} onChange={handleInputChange} required />
      )}
      {role === 'parent' && (
        <InputField name="whatsappNumber" placeholder="Nomor WhatsApp" value={formData.whatsappNumber} onChange={handleInputChange} required />
      )}
    </div>
  );

  return (
    <div className="min-h-screen w-full bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <img 
            className="mx-auto h-24 w-auto" 
            src="/logo-smpn6.png"
            alt="Logo SMPN 6 Pekalongan"
          />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Buat Akun Baru
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            ISOKURIKULER SMPN 6 PEKALONGAN
          </p>
        </div>

        <div className="bg-white shadow-xl rounded-2xl p-8 space-y-6">
          <div className="flex justify-center bg-gray-100 rounded-lg p-1">
            {['student', 'teacher', 'parent'].map((r) => (
              <button
                key={r}
                onClick={() => handleRoleChange(r as any)}
                className={`w-full py-2.5 text-sm font-medium rounded-md transition-all duration-300 ${role === r ? 'bg-white text-blue-700 shadow' : 'text-gray-500 hover:text-gray-800'}`}>
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <InputField name="fullName" placeholder="Nama Lengkap" value={formData.fullName} onChange={handleInputChange} required />
            <InputField name="password" type="password" placeholder="Password" value={formData.password} onChange={handleInputChange} required />
            {renderRoleSpecificFields()}
            
            {error && <p className="text-sm text-red-600 text-center">{error}</p>}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed"
              >
                {loading ? 'MEMPROSES...' : 'DAFTAR'}
              </button>
            </div>
          </form>
          
          <div className="text-sm text-center text-gray-600">
            <p>
              Sudah punya akun?{' '}
              <Link to="/login" className="font-medium text-blue-700 hover:text-blue-600 hover:underline">
                Masuk di sini
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const InputField: React.FC<any> = ({ name, placeholder, value, onChange, type = 'text', required = false }) => (
  <input
    name={name}
    type={type}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    required={required}
    className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent sm:text-sm"
  />
);

export default Register;
