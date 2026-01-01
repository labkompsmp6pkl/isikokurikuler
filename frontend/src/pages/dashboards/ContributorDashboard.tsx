import React from 'react';
// Hapus useNavigate karena logout di authService biasanya sudah menangani redirect
// import { useNavigate } from 'react-router-dom'; 
import { useAuth } from '../../services/authService'; // 1. Import useAuth

const ContributorDashboard: React.FC = () => {
  // 2. Ambil fungsi logout dari context
  const { logout } = useAuth(); 

  const handleLogout = () => {
    if (window.confirm('Apakah Anda yakin ingin keluar?')) {
      // 3. Panggil fungsi logout dari service
      // Ini akan membersihkan localStorage DAN state aplikasi, lalu redirect ke login
      logout();
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        
        {/* Ikon */}
        <div className="mb-4 flex justify-center">
            <span className="text-4xl">👨‍🏫</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-2">Dasbor Kontributor</h1>
        
        <p className="text-gray-600 mb-8 leading-relaxed">
          Selamat datang! Fitur khusus untuk Kontributor (Guru Mapel/Ekskul) sedang dalam pengembangan dan akan segera tersedia di halaman ini.
        </p>

        {/* Tombol Logout */}
        <button
          onClick={handleLogout}
          className="w-full bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
          </svg>
          Keluar Akun
        </button>

      </div>
    </div>
  );
};

export default ContributorDashboard;