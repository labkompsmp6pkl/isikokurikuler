import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../services/authService';

// Definisikan tipe untuk peran
type Role = 'student' | 'teacher' | 'contributor' | 'parent' | 'admin';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'student' as Role,
    nisn: '',
    nip: '',
    class: '',
    whatsappNumber: '',
  });
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await authService.register(formData);
      // Arahkan ke halaman login setelah berhasil mendaftar
      navigate('/login');
    } catch (err) {
      setError('Gagal mendaftar. Email mungkin sudah digunakan atau data tidak valid.');
      console.error(err);
    }
  };

  const renderRoleSpecificFields = () => {
    const { role } = formData;

    switch (role) {
      case 'student':
        return (
          <>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="nisn">NISN</label>
              <input id="nisn" name="nisn" type="text" onChange={handleInputChange} required className="w-full p-3 border border-gray-300 rounded-lg" placeholder="NISN Anda" />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="whatsappNumber">Nomor WhatsApp</label>
              <input id="whatsappNumber" name="whatsappNumber" type="text" onChange={handleInputChange} required className="w-full p-3 border border-gray-300 rounded-lg" placeholder="08xxxx" />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="class">Kelas</label>
              <select id="class" name="class" onChange={handleInputChange} required className="w-full p-3 border border-gray-300 rounded-lg">
                <option value="">Pilih Kelas</option>
                {['7A', '7B', '7C', '7D'].map(c => <option key={c} value={c}>{c}</option>)}
                {['8A', '8B', '8C', '8D'].map(c => <option key={c} value={c}>{c}</option>)}
                {['9A', '9B', '9C', '9D'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </>
        );
      case 'teacher': // Wali Kelas
        return (
          <>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="nip">NIP</label>
              <input id="nip" name="nip" type="text" onChange={handleInputChange} required className="w-full p-3 border border-gray-300 rounded-lg" placeholder="NIP Anda" />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="class">Wali Kelas</label>
              <select id="class" name="class" onChange={handleInputChange} required className="w-full p-3 border border-gray-300 rounded-lg">
                <option value="">Pilih Kelas</option>
                {['7A', '7B', '7C', '7D'].map(c => <option key={c} value={c}>{c}</option>)}
                {['8A', '8B', '8C', '8D'].map(c => <option key={c} value={c}>{c}</option>)}
                {['9A', '9B', '9C', '9D'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </>
        );
      case 'contributor': // Guru Mapel / Ekskul
        return (
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="nip">NIP</label>
            <input id="nip" name="nip" type="text" onChange={handleInputChange} required className="w-full p-3 border border-gray-300 rounded-lg" placeholder="NIP Anda" />
          </div>
        );
      case 'parent':
        return (
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="whatsappNumber">Nomor WhatsApp</label>
              <input id="whatsappNumber" name="whatsappNumber" type="text" onChange={handleInputChange} required className="w-full p-3 border border-gray-300 rounded-lg" placeholder="Nomor WhatsApp Anda" />
            </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 font-sans">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Buat Akun Baru</h2>
        
        <form onSubmit={handleRegister}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="role">Saya adalah seorang...</label>
            <select id="role" name="role" value={formData.role} onChange={handleInputChange} className="w-full p-3 border border-gray-300 rounded-lg">
              <option value="student">Siswa</option>
              <option value="teacher">Guru (Wali Kelas)</option>
              <option value="contributor">Kontributor (Guru Mapel / Ekskul)</option>
              <option value="parent">Orang Tua</option>
              <option value="admin">Administrator</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="fullName">Nama Lengkap</label>
            <input id="fullName" name="fullName" type="text" onChange={handleInputChange} required className="w-full p-3 border border-gray-300 rounded-lg" placeholder="Nama Lengkap Anda" />
          </div>

          {formData.role !== 'parent' && (
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="email">Alamat Email</label>
              <input id="email" name="email" type="email" onChange={handleInputChange} required className="w-full p-3 border border-gray-300 rounded-lg" placeholder="email@contoh.com" />
            </div>
          )}
          
          {renderRoleSpecificFields()}

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="password">Password</label>
            <input id="password" name="password" type="password" onChange={handleInputChange} required className="w-full p-3 border border-ray-300 rounded-lg" placeholder="••••••••" />
          </div>

          {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">{error}</div>}
          
          <div>
            <button type="submit" className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">
              Daftar
            </button>
          </div>
        </form>

        <p className="text-center text-gray-600 mt-4">
          Sudah punya akun? <Link to="/login" className="text-blue-600 hover:underline">Login di sini</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
