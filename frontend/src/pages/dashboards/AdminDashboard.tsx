import React from 'react';
import { LogOut, Construction } from 'lucide-react';

const AdminDashboard: React.FC = () => {

  // Fungsi Logout Aman
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] font-sans flex flex-col items-center justify-center p-6">
      
      {/* Kartu Coming Soon */}
      <div className="bg-white p-10 md:p-14 rounded-[2.5rem] shadow-2xl max-w-xl w-full flex flex-col items-center text-center border border-gray-100 relative overflow-hidden">
        
        {/* Dekorasi Background */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-50 rounded-full blur-2xl opacity-50"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-pink-50 rounded-full blur-2xl opacity-50"></div>

        {/* Icon */}
        <div className="bg-indigo-50 p-6 rounded-3xl mb-6 shadow-sm border border-indigo-100 animate-bounce-slow relative z-10">
            <Construction size={64} className="text-indigo-600" />
        </div>
        
        {/* Teks Utama */}
        <h1 className="text-4xl font-black text-gray-900 mb-3 tracking-tight relative z-10">
          Segera Hadir
        </h1>
        <p className="text-gray-500 text-lg mb-10 leading-relaxed relative z-10">
          Dashboard Administrator sedang dalam tahap pengembangan intensif. Kami sedang menyiapkan fitur manajemen data terbaik untuk Anda.
        </p>

        {/* Tombol Aksi */}
        <div className="flex flex-col w-full gap-3 relative z-10">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-red-50 text-red-600 font-bold rounded-2xl hover:bg-red-100 transition-all border border-red-100 hover:shadow-lg hover:shadow-red-50"
          >
            <LogOut size={20} />
            Keluar Aplikasi
          </button>
        </div>

      </div>
      
      {/* Footer */}
      <p className="mt-8 text-gray-400 text-xs font-bold tracking-[0.2em] uppercase">
        ISIKOKURIKULER &copy; {new Date().getFullYear()}
      </p>
    </div>
  );
};

export default AdminDashboard;