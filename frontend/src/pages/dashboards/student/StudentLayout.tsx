import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  PenTool, 
  History, 
  LogOut, 
  Menu, 
  X} from 'lucide-react';
import { useAuth, authApi } from '../../../services/authService';

const StudentLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [classNameFromApi, setClassNameFromApi] = useState<string | null>(null);

  // 1. Logic sinkronisasi kelas yang lebih akurat
  useEffect(() => {
    const fetchClassName = async () => {
      const classId = (user as any)?.classId || (user as any)?.class_id;
      
      if (classId) {
        try {
          const response = await authApi.get('/auth/classes-list');
          const classes = response.data.data || response.data;
          const found = classes.find((c: any) => c.id == classId);
          if (found) {
            setClassNameFromApi(found.name);
          }
        } catch (err) {
          console.error("Gagal sinkronisasi nama kelas:", err);
        }
      }
    };

    if (user) fetchClassName();
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userData = {
    fullName: (user as any)?.fullName || user?.name || 'Siswa',
    firstName: ((user as any)?.fullName || user?.name || 'Siswa').split(' ')[0],
    className: classNameFromApi || (user as any)?.class_name || (user as any)?.student_class || '-',
    initial: ((user as any)?.fullName || user?.name || 'S').charAt(0)
  };

  const navItems = [
    { path: '/student', label: 'Beranda', icon: <LayoutDashboard size={20} />, end: true },
    { path: '/student/journal', label: 'Isi Jurnal', icon: <PenTool size={20} /> },
    { path: '/student/history', label: 'Riwayat', icon: <History size={20} /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Overlay Mobile */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden backdrop-blur-sm transition-opacity" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar Desktop & Mobile */}
      <aside className={`fixed md:sticky top-0 h-screen w-72 bg-white border-r border-gray-200 z-50 transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        
        {/* --- HEADER SIDEBAR DENGAN LOGO --- */}
        <div className="p-6 flex items-center justify-between border-b border-gray-50 bg-white">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-blue-50 rounded-xl shadow-sm">
              <img src="/logo-smpn6.png" alt="Logo SMPN 6" className="w-8 h-8 object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-blue-900 leading-none text-sm tracking-tighter">KOKURIKULER</span>
              <span className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-[0.2em]">SMPN 6 Pekalongan</span>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 text-gray-400 hover:bg-gray-100 rounded-full">
            <X size={24} />
          </button>
        </div>

        {/* Menu Navigasi */}
        <nav className="p-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              onClick={() => setIsSidebarOpen(false)}
              className={({ isActive }) => `flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all font-semibold ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-[1.02]' : 'text-gray-500 hover:bg-blue-50 hover:text-blue-600'}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Bagian Profil & Logout Bawah */}
        <div className="absolute bottom-0 w-full p-4 border-t border-gray-100 bg-gray-50/50">
          <div className="bg-white p-4 rounded-[1.5rem] border border-gray-200 shadow-sm mb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 shrink-0 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-black text-lg shadow-lg">
                {userData.initial}
              </div>
              <div className="overflow-hidden">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1.5">Ananda</p>
                <p className="text-sm font-black text-gray-800 truncate leading-tight">{userData.fullName}</p>
                <div className="inline-block mt-2 px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded-md">
                   <p className="text-[10px] font-black text-indigo-600 uppercase tracking-wider">Kelas {userData.className}</p>
                </div>
              </div>
            </div>
          </div>

          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-black text-red-600 bg-white border border-red-100 hover:bg-red-600 hover:text-white rounded-2xl transition-all shadow-sm active:scale-95 group">
            <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span>Keluar Aplikasi</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header Mobile */}
        <header className="md:hidden bg-white border-b border-gray-200 p-4 sticky top-0 z-30 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <img src="/logo-smpn6.png" alt="Logo" className="w-7 h-7" />
              <span className="font-black text-blue-900 text-xs tracking-tighter uppercase">kokurikuler</span>
            </div>
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-blue-600 bg-blue-50 rounded-xl active:scale-90 transition-transform shadow-sm">
              <Menu size={24} />
            </button>
          </div>
          
          <div className="flex items-center gap-3 pt-3 border-t border-gray-50 mt-2">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xs shadow-md">
              {userData.initial}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-[10px] font-bold text-gray-400 leading-none">Profil Siswa</p>
              <p className="text-xs font-black text-gray-800 truncate leading-tight mt-1">{userData.fullName}</p>
            </div>
            <div className="bg-indigo-600 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase shadow-sm shadow-indigo-100">
              {userData.className}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-10 custom-scrollbar">
          <div className="max-w-5xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default StudentLayout;