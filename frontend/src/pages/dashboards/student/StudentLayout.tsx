import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  PenTool, 
  History, 
  LogOut, 
  Menu, 
  X 
} from 'lucide-react';
import { useAuth } from '../../../services/authService';

const StudentLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Helper untuk mendapatkan data user dengan aman
  const userData = {
    name: (user as any)?.fullName || user?.name || 'Siswa',
    className: (user as any)?.class || (user as any)?.student_class || '-',
    initial: ((user as any)?.fullName || user?.name || 'S').charAt(0)
  };

  const navItems = [
    { 
      path: '/student', 
      label: 'Beranda', 
      icon: <LayoutDashboard size={20} />, 
      end: true 
    },
    { 
      path: '/student/journal', 
      label: 'Isi Jurnal', 
      icon: <PenTool size={20} /> 
    },
    { 
      path: '/student/history', 
      label: 'Riwayat', 
      icon: <History size={20} /> 
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Sidebar Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside className={`
        fixed md:sticky top-0 h-screen w-64 bg-white border-r border-gray-200 z-30 transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Logo Section */}
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo-smpn6.png" alt="Logo" className="w-8 h-8" />
            <span className="font-bold text-gray-800">ISOKURIKULER</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-gray-500">
            <X size={24} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="px-4 space-y-2 mt-4">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              onClick={() => setIsSidebarOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium
                ${isActive 
                  ? 'bg-blue-50 text-blue-600 border border-blue-100' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
              `}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User Profile & Logout Section */}
        <div className="absolute bottom-0 w-full p-4 border-t border-gray-100 bg-gray-50">
          
          {/* Info Siswa: Nama & Kelas */}
          <div className="flex items-center gap-3 mb-4 px-2">
            {/* [FIX] shrink-0: Mencegah lingkaran jadi oval saat nama panjang */}
            <div className="w-10 h-10 shrink-0 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shadow-md">
              {userData.initial}
            </div>
            
            <div className="overflow-hidden w-full">
              {/* [FIX] break-words: Agar nama panjang turun ke bawah (tidak terpotong ...) */}
              <p className="text-sm font-bold text-gray-800 break-words leading-tight">
                {userData.name}
              </p>
              
              <div className="mt-1">
                 <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    userData.className !== '-' 
                    ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' 
                    : 'bg-gray-200 text-gray-500'
                 }`}>
                    {userData.className !== '-' ? `Kelas ${userData.className}` : 'Siswa'}
                 </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-100 hover:bg-red-50 hover:border-red-200 rounded-lg transition-all shadow-sm"
          >
            <LogOut size={18} />
            <span>Keluar Aplikasi</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="md:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <img src="/logo-smpn6.png" alt="Logo" className="w-8 h-8" />
            <span className="font-bold text-gray-800 text-sm">ISOKURIKULER</span>
          </div>
          <button onClick={() => setIsSidebarOpen(true)} className="text-gray-600">
            <Menu size={24} />
          </button>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-5xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default StudentLayout;