import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const StudentLayout: React.FC = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;

  const handleLogout = () => {
    toast.success('Anda telah berhasil keluar.');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Tutup menu saat link navigasi diklik
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Utama */}
      <header className="bg-white shadow-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            {/* Identitas Aplikasi */}
            <div className="flex items-center space-x-3">
              <img className="h-10 w-auto" src="/logo-smpn6.png" alt="Logo SMPN 6 Pekalongan" />
              <div className="hidden sm:flex flex-col">
                <span className="font-bold text-lg text-blue-800">ISOKURIKULER</span>
                <span className="text-xs text-gray-500">SMPN 6 PEKALONGAN</span>
              </div>
            </div>

            {/* Navigasi Desktop */}
            <nav className="hidden md:flex items-center space-x-4">
              <NavLink 
                to="/student/dashboard/beranda" 
                className={({ isActive }) => 
                  `py-2 px-3 rounded-md font-medium text-sm ` + 
                  (isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800')
                }
              >
                Beranda
              </NavLink>
              <NavLink 
                to="/student/dashboard/riwayat" 
                className={({ isActive }) => 
                  `py-2 px-3 rounded-md font-medium text-sm ` + 
                  (isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800')
                }
              >
                Riwayat
              </NavLink>
            </nav>

            {/* Informasi Pengguna & Logout (Desktop) */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="text-right">
                <p className="font-semibold text-gray-800">{user?.fullName}</p>
                <p className="text-sm text-gray-600">Siswa - Kelas {user?.class}</p>
              </div>
              <button 
                onClick={handleLogout}
                className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none"
                title="Keluar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              </button>
            </div>

            {/* Tombol Hamburger (Mobile) */}
            <div className="md:hidden flex items-center">
                <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-md text-gray-600 hover:bg-gray-100">
                    {isMenuOpen ? (
                        <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    ) : (
                        <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
                    )}
                </button>
            </div>
          </div>
        </div>

        {/* Panel Menu Mobile */}
        {isMenuOpen && (
            <div className="md:hidden bg-white border-t border-gray-200">
                <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                    <NavLink to="/student/dashboard/beranda" onClick={closeMenu} className={({isActive}) => `block px-3 py-2 rounded-md text-base font-medium ${isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>Beranda</NavLink>
                    <NavLink to="/student/dashboard/riwayat" onClick={closeMenu} className={({isActive}) => `block px-3 py-2 rounded-md text-base font-medium ${isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>Riwayat</NavLink>
                </div>
                {/* Info User di Mobile Menu */}
                <div className="pt-4 pb-3 border-t border-gray-200">
                    <div className="flex items-center px-5">
                        <div className="ml-3">
                            <p className="text-base font-medium text-gray-800">{user?.fullName}</p>
                            <p className="text-sm font-medium text-gray-500">Siswa - Kelas {user?.class}</p>
                        </div>
                    </div>
                    <div className="mt-3 px-2 space-y-1">
                        <button onClick={() => { closeMenu(); handleLogout(); }} className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-800">Keluar</button>
                    </div>
                </div>
            </div>
        )}
      </header>

      {/* Konten Halaman */}
      <main className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default StudentLayout;
