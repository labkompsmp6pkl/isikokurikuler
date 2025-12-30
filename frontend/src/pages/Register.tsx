import React, { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import authService from '../services/authService';

// Definisikan tipe untuk peran agar konsisten
type Role = 'student' | 'teacher' | 'contributor' | 'parent';

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
        nip: selectedRole === 'teacher' || selectedRole === 'contributor' ? formData.nip : undefined,
        whatsappNumber: selectedRole === 'parent' ? formData.whatsappNumber : undefined,
        class: (selectedRole === 'student' || selectedRole === 'teacher') ? formData.class : undefined,
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleGoogleRegister = () => {
    const origin = window.location.origin;
    const googleLoginUrl = `${import.meta.env.VITE_API_URL}/api/auth/google?origin=${encodeURIComponent(origin)}`;
    window.location.href = googleLoginUrl;
  };

  const renderRoleSpecificFields = () => {
    switch (selectedRole) {
      case 'student':
        return (
          <>
            <input type="text" name="fullName" placeholder="Nama Lengkap" required onChange={handleInputChange} className="input-field" />
            <input type="text" name="nisn" placeholder="NISN" required onChange={handleInputChange} className="input-field" />
            <input type="text" name="class" placeholder="Kelas (Contoh: 7A)" required onChange={handleInputChange} className="input-field" />
          </>
        );
      case 'teacher':
      case 'contributor':
        return (
          <>
            <input type="text" name="fullName" placeholder="Nama Lengkap" required onChange={handleInputChange} className="input-field" />
            <input type="text" name="nip" placeholder="NIP" required onChange={handleInputChange} className="input-field" />
          </>
        );
      case 'parent':
        return (
          <>
            <input type="text" name="fullName" placeholder="Nama Lengkap" required onChange={handleInputChange} className="input-field" />
            <input type="text" name="whatsappNumber" placeholder="Nomor WhatsApp" required onChange={handleInputChange} className="input-field" />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-xl w-full mx-auto bg-white shadow-xl rounded-2xl">
        <div className="p-8 md:p-10">
          <div className="text-center mb-8">
            <img className="mx-auto h-20 w-auto" src="/logo-smpn6.png" alt="Logo SMPN 6 Pekalongan" />
            <h2 className="mt-4 text-2xl font-bold text-gray-900">Buat Akun Baru</h2>
            <p className="text-sm text-gray-600">Daftar untuk mengakses fitur Isokurikuler.</p>
          </div>

          {/* Tombol Daftar dengan Google */}
          <div className="mb-6">
            <button
              onClick={handleGoogleRegister}
              type="button"
              className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <img className="h-5 w-5 mr-3" src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google logo" />
              Daftar dengan Google
            </button>
          </div>

          <div className="relative flex py-4 items-center">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="flex-shrink mx-4 text-gray-500 text-sm">Atau daftar manual</span>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Saya mendaftar sebagai:</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {(['student', 'teacher', 'parent', 'contributor'] as Role[]).map(role => (
                  <button key={role} type="button" onClick={() => setSelectedRole(role)} className={`px-4 py-2 text-sm font-medium rounded-lg border ${selectedRole === role ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {renderRoleSpecificFields()}

            <input type="password" name="password" placeholder="Password" required onChange={handleInputChange} className="input-field" />
            <input type="password" name="confirmPassword" placeholder="Konfirmasi Password" required onChange={handleInputChange} className="input-field" />

            {error && <p className="text-xs text-red-600 text-center pt-1">{error}</p>}

            <div>
              <button type="submit" disabled={loading} className="w-full btn-primary mt-2">
                {loading ? 'MEMPROSES...' : 'DAFTAR'}
              </button>
            </div>

            <p className="text-center text-sm text-gray-600 pt-3">
              Sudah punya akun? <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500 hover:underline">Masuk di sini</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
